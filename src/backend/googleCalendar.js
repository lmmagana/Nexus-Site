import { secrets } from 'wix-secrets-backend.v2';
import { query, save, remove } from 'wix-data';
import { fetch } from 'wix-fetch';
import { extendedBookings } from "@wix/bookings";
import { elevate } from 'wix-auth';

// ─── Calendar ID helpers ────────────────────────────────────────────
async function getCalendarId() {
    const { value } = await secrets.getSecretValue('google_calendar_id_teacher_only');
    return value;
}

// ─── OAuth / token helpers ────────────────────────────────────────────

async function getAccessToken() {
    const { value: clientId } = await secrets.getSecretValue('google_oauth_client_id');
    const { value: clientSecret } = await secrets.getSecretValue('google_oauth_client_secret');
    const { value: refreshToken } = await secrets.getSecretValue('google_oauth_refresh_token');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: [
            `client_id=${encodeURIComponent(clientId)}`,
            `client_secret=${encodeURIComponent(clientSecret)}`,
            `refresh_token=${encodeURIComponent(refreshToken)}`,
            `grant_type=refresh_token`,
        ].join('&'),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to refresh access token: ${err}`);
    }

    const { access_token } = await res.json();
    return access_token;
}

// ─── Event builder helpers ────────────────────────────────────────────

function getClientName(payload) {
    const first = payload.contact?.name?.first ?? payload.booking_contact_first_name ?? '';
    const last = payload.contact?.name?.last ?? payload.booking_contact_last_name ?? '';
    return `${first} ${last}`.trim() || 'Unknown Client';
}

function getInstructorName(payload) {
    return payload.staff_member_name ?? payload.staff_member_name_main_language ?? 'Unknown Instructor';
}

function getInstructorInitials(payload) {
    const fullName = getInstructorName(payload);
    return fullName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
}

function getPrimaryResource(payload) {
    return payload.primary_resource_name ?? null;
}

function getService(payload) {
    return payload.service_name ?? payload.service_name_main_language ?? 'Unknown Service';
}

function buildEventTitle(payload) {
    const client = getClientName(payload);
    const initials = getInstructorInitials(payload);
    const service = getService(payload);
    return `${client} | ${service} | (${initials})`;
}

function buildDescription(payload) {
    const client = getClientName(payload);
    const instructor = getInstructorName(payload);
    const resource = getPrimaryResource(payload);
    const phone = payload.booking_contact_phone ?? payload.contact?.phone ?? 'N/A';
    const email = payload.contact?.email ?? payload.staff_member_email ?? 'N/A';

    const customFields = (payload.custom_form_fields ?? [])
        .map(f => `  ${f.label}: ${f.value}`)
        .join('\n');

    return [
        `Client's Name: ${client}`,
        `Phone Number: ${phone}`,
        `Email: ${email}`,
        '\n',
        `Instructor: ${instructor}`,
        `Service: ${payload.service_name ?? 'N/A'}`,
        `Pricing Plan: ${payload.pricing_plan ?? 'N/A'}`,
        '\n',
        customFields ? `InAdditional Info:\n${customFields}` : '',
    ].filter(Boolean).join('\n');
}

function buildGoogleEvent(payload) {
    const rawStart = payload.start_time_timestamp_with_timezone ?? payload.start_date;
    const rawEnd = payload.end_date;
    const tz = payload.business_time_zone ?? 'UTC';

    return {
        summary: buildEventTitle(payload),
        description: buildDescription(payload),
        location: payload.location ?? payload.location_main_language ?? '',
        start: { dateTime: rawStart, timeZone: tz },
        end: { dateTime: rawEnd, timeZone: tz },
        colorId: '2',
    };
}

// ─── CalendarEventMap helpers ─────────────────────────────────────────

async function findMapRecord(bookingId) {
    const results = await query('CalendarEventMap')
        .eq('bookingId', bookingId)
        .find({ suppressHooks: true, consistentRead: true });
    return results.items[0] ?? null;
}

function buildEventMapTitle(payload) {
    const tz = payload.business_time_zone ?? 'UTC';
    const rawStart = payload.start_time_timestamp_with_timezone ?? payload.start_date;
    const startDate = new Date(rawStart).toLocaleString('en-US', {
        timeZone: tz,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const client = getClientName(payload);
    const initials = getInstructorInitials(payload);
    const service = getService(payload);

    return `${startDate} | ${client} | ${service} | (${initials})`;
}

// ─── Public web-methods ───────────────────────────────────────────────

export async function createCalendarEvent(payload) {
    const calendarId = await getCalendarId();
    const token = await getAccessToken();

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildGoogleEvent(payload)),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Calendar insert failed: ${err}`);
    }

    const { id: googleEventId } = await res.json();

    await save('CalendarEventMap', {
        title: `${buildEventMapTitle(payload)}`,
        bookingId: payload.booking_id,
        googleEventId,
    }, { suppressHooks: true });

    //console.log('Saved map record:', payload.booking_id, '→', googleEventId);
    return googleEventId;
}

export async function updateCalendarEvent(payload) {
    const calendarId = await getCalendarId();
    const bookingId = payload.booking_id;
    const record = await findMapRecord(bookingId);

    if (!record) {
        console.warn(`No existing event for booking ${bookingId}, creating instead.`);
        return createCalendarEvent(payload);
    }

    const tz = payload.business_time_zone ?? 'UTC';

    const patch = {
        summary: buildEventTitle(payload),
        description: buildDescription(payload),
        location: payload.location ?? payload.location_main_language ?? '',
        start: {
            dateTime: payload.start_time_timestamp_with_timezone ?? payload.start_date,
            timeZone: tz,
        },
        end: {
            dateTime: payload.end_date,
            timeZone: tz,
        },
    };

    const token = await getAccessToken();

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${record.googleEventId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patch),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Calendar patch failed: ${err}`);
    }

    return record.googleEventId;
}

export async function deleteCalendarEvent(payload) {
    const calendarId = await getCalendarId();
    const bookingId = payload.booking_id;
    const record = await findMapRecord(bookingId);

    if (!record) {
        console.warn(`No Google event found for booking ${bookingId}`);
        return;
    }

    const token = await getAccessToken();

    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${record.googleEventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!res.ok && res.status !== 410) {
        const err = await res.text();
        throw new Error(`Google Calendar delete failed: ${err}`);
    }

    await remove('CalendarEventMap', record._id);
}

// ─── One Time Migration ───────────────────────────────────────────────
function shapeBookingPayload(booking) {
    const slot      = booking.bookedEntity?.slot ?? {};
    const firstName = booking.contactDetails?.firstName ?? '';
    const lastName  = booking.contactDetails?.lastName  ?? '';

    const customFields = (booking.additionalFields ?? [])
        .filter(f => f.value)
        .map(f => ({ label: f.label, value: f.value }));

    return {
        booking_id:                         booking._id,
        service_name:                       booking.bookedEntity?.title ?? '',
        service_name_main_language:         booking.bookedEntity?.title ?? '',
        staff_member_name:                  slot.resource?.name ?? '',
        staff_member_name_main_language:    slot.resource?.name ?? '',
        start_date:                         booking.startDate ?? '',
        start_time_timestamp_with_timezone: slot.startDate ?? booking.startDate ?? '',
        end_date:                           booking.endDate ?? '',
        business_time_zone:                 slot.timezone ?? 'UTC',
        location:                           slot.location?.formattedAddress ?? '',
        location_main_language:             slot.location?.formattedAddress ?? '',
        primary_resource_name:              slot.location?.name ?? '',
        pricing_plan:                       booking.selectedPaymentOption ?? '',
        booking_contact_first_name:         firstName,
        booking_contact_last_name:          lastName,
        booking_contact_phone:              booking.contactDetails?.phone ?? '',
        contact_id:                         booking.contactDetails?.contactId ?? '',
        order_id:                           booking._id,
        contact: {
            name: {
                first: firstName,
                last:  lastName,
            },
            email:     booking.contactDetails?.email ?? '',
            phone:     booking.contactDetails?.phone ?? '',
            contactId: booking.contactDetails?.contactId ?? '',
        },
        custom_form_fields:  customFields,
        manage_booking_link: '',
        cancellation_link:   '',
        rescheduling_link:   '',
    };
}

export async function migrateExistingBookings(limit = 5) {
    const elevatedQueryExtendedBookings = elevate(extendedBookings.queryExtendedBookings);

    const APPOINTMENT_TITLES = ['Intro Lesson', 'Private Lesson', 'Wedding Intro Lesson'];
    const processedThisRun   = new Set(); // in-memory dedup guard

    let totalProcessed = 0;
    let totalSkipped   = 0;
    let totalFailed    = 0;
    let cursor         = null;
    let hasNext        = true;

    console.log(`── Migration starting ── limit: ${limit} | after: ${new Date().toISOString()}`);

    while (hasNext) {
        const response = await elevatedQueryExtendedBookings({
            filter: {
                'startDate':          { '$gt': new Date().toISOString() },
                'status':             { '$ne': 'CANCELED' },
                'bookedEntity.title': { '$in': APPOINTMENT_TITLES },
            },
            sort: [{ fieldName: 'startDate', order: 'ASC' }],
            cursorPaging: {
                limit:  100,
                cursor: cursor ?? undefined,
            },
        });

        const items = response?.extendedBookings ?? [];

        if (!items.length) break;

        for (const extendedBooking of items) {
            if (totalProcessed >= limit) {
                hasNext = false;
                break;
            }

            const booking   = extendedBooking.booking;
            const bookingId = booking._id;
            const title     = booking.bookedEntity?.title ?? '';

            // In-memory guard — catches duplicates within the same run
            if (processedThisRun.has(bookingId)) {
                console.log(`Already processed this run, skipping: "${title}" | ${bookingId}`);
                totalSkipped++;
                continue;
            }

            const existing = await findMapRecord(bookingId);
            if (existing) {
                console.log(`Already synced, skipping: "${title}" | ${bookingId}`);
                totalSkipped++;
                continue;
            }

            try {
                const payload = shapeBookingPayload(booking);
                await createCalendarEvent(payload);
                console.log(`Migrated: "${title}" | ${bookingId}`);
                totalProcessed++;
            } catch (err) {
                console.warn(`Failed: "${title}" | ${bookingId} | ${err.message}`);
                totalFailed++;
            }
        }

        const nextCursor = response?.pagingMetadata?.cursors?.next;
        if (!nextCursor || nextCursor === cursor) {
            hasNext = false;
        } else {
            cursor = nextCursor;
        }
    }

    console.log(`── Migration complete ── Processed: ${totalProcessed} | Skipped: ${totalSkipped} | Failed: ${totalFailed}`);
}