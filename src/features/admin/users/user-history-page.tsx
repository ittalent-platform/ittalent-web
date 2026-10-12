import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { ClampedText } from "@/components/common/clamped-text";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { LoadingScreen } from "@/components/common/loading-screen";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/common/form-field";
import { ADMIN_USERS_PATH, adminUserPath } from "@/config/routes";
import { formatTimeIct, ictDayHeading, ictDayKey } from "@/lib/format";

import { historyActorKey, userDisplayName } from "./user-display";
import { historyChips, validateHistoryRange, type HistoryChip } from "./user-history";
import {
  HISTORY_ACTORS,
  HISTORY_GROUPS,
  HISTORY_TIME_ZONE_LABEL,
  type HistoryActor,
  type HistoryGroup,
} from "./user-history.constants";
import { useUserDetailQuery, useUserHistoryFeedQuery, type HistoryFilters } from "./users.queries";
import { AdminPageHeader } from "@/components/common/admin-page-header";

const PARAMS = { actor: "actor", from: "from", group: "group", to: "to" } as const;
/** Several event types travel in one query value: `group=account,email`. */
const GROUP_SEPARATOR = ",";
const FIELD_CLASS = "flex items-center gap-2.5 text-[13.5px] text-foreground";
const CONTROL_CLASS = "size-4 shrink-0 cursor-pointer accent-primary";
const SECTION_LABEL_CLASS = "eyebrow";

export function AdminUserHistoryPage() {
  const { t } = useTranslation();
  const chipText = (chip: HistoryChip) => `${t(`adminUsers.history.field.${chip.field}`, { defaultValue: chip.field })}: ${chip.before !== undefined ? `${chip.before ?? "—"} → ` : ""}${chip.after ?? "—"}`;
  const { userId = "" } = useParams<{ userId: string }>();
  const [params, setParams] = useSearchParams();
  // No `group` in the URL means every event type; an empty or complete selection filters nothing either.
  const rawGroups = params.get(PARAMS.group);
  const checkedGroups = rawGroups === null ? [...HISTORY_GROUPS] : HISTORY_GROUPS.filter((value) => rawGroups.split(GROUP_SEPARATOR).includes(value));
  const group = checkedGroups.length === 0 || checkedGroups.length === HISTORY_GROUPS.length ? undefined : checkedGroups;
  const actor = HISTORY_ACTORS.find((value) => value === params.get(PARAMS.actor));
  const from = params.get(PARAMS.from) ?? "";
  const to = params.get(PARAMS.to) ?? "";
  const rangeError = validateHistoryRange(from, to);
  const filters: HistoryFilters = { actor, from: from || undefined, group, to: to || undefined };
  const user = useUserDetailQuery(userId);
  const feed = useUserHistoryFeedQuery(userId, filters, Boolean(userId) && !rangeError);
  const events = useMemo(() => feed.data?.pages.flatMap((page) => page.items) ?? [], [feed.data]);
  const total = feed.data?.pages[0]?.total ?? 0;
  const days = useMemo(() => {
    const byDay = new Map<string, typeof events>();
    for (const event of events) byDay.set(ictDayKey(event.occurredAt), [...(byDay.get(ictDayKey(event.occurredAt)) ?? []), event]);
    return [...byDay.values()];
  }, [events]);
  const filtered = Boolean(group || actor || from || to) || rawGroups !== null;

  function setParam(key: string, value: string | undefined) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }

  function toggleGroup(value: HistoryGroup, checked: boolean) {
    const next = HISTORY_GROUPS.filter((item) => (item === value ? checked : checkedGroups.includes(item)));
    setParams((current) => {
      const nextParams = new URLSearchParams(current);
      if (next.length === HISTORY_GROUPS.length) nextParams.delete(PARAMS.group); else nextParams.set(PARAMS.group, next.join(GROUP_SEPARATOR));
      return nextParams;
    }, { replace: true });
  }

  if (user.isLoading) return <LoadingScreen />;
  if (!user.data) return <InlineBanner tone="error">{t("adminUsers.detail.notFoundDescription")}</InlineBanner>;
  const subject = user.data;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb ariaLabel={t("adminUsers.detail.breadcrumb")} items={[{ label: t("adminUsers.page.title"), to: ADMIN_USERS_PATH }, { label: userDisplayName(subject), to: adminUserPath(userId) }, { label: t("adminUsers.detail.history") }]} />
      <AdminPageHeader
        description={<span className="line-clamp-2 wrap-anywhere" title={userDisplayName(subject)}>{userDisplayName(subject)} · {t("adminUsers.history.timeZoneNote", { zone: HISTORY_TIME_ZONE_LABEL })}</span>}
        title={t("adminUsers.detail.history")}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          {rangeError ? <InlineBanner tone="warning">{t("adminUsers.history.rangeInvalid")}</InlineBanner> : null}
          {feed.isError && !rangeError ? <ErrorState description={t("adminUsers.history.loadFailed")} onRetry={() => void feed.refetch()} title={t("adminUsers.history.loadFailedTitle")} /> : null}
          {feed.isLoading && !rangeError ? <LoadingScreen /> : null}
          {feed.data && events.length === 0 ? <EmptyState description={t(filtered ? "adminUsers.history.emptyFiltered" : "adminUsers.history.emptyDescription")} title={t("adminUsers.history.empty")} /> : null}
          {feed.data && events.length > 0 ? (
            <div className="surface-card px-7 pb-6 pt-6" data-testid="history-card">
              <div className="flex flex-col gap-10">
                {days.map((dayEvents) => {
                  const heading = ictDayHeading(dayEvents[0].occurredAt);
                  const title = heading.kind === "weekday" ? heading.weekday : t(`adminUsers.history.${heading.kind}`);
                  return (
                    <section aria-label={`${title} ${heading.date}`} key={ictDayKey(dayEvents[0].occurredAt)}>
                      <h2 className="mb-3 flex flex-wrap items-baseline gap-2 text-[13.5px]"><strong className="font-bold text-foreground">{title}</strong><span className="text-muted-foreground">{heading.date}</span></h2>
                      <ul className="flex flex-col">
                        {dayEvents.map((item, index) => {
                          const chips = historyChips(item.changes);
                          const actorKey = historyActorKey(item.actorId, userId);
                          return (
                            <li className="relative flex min-w-0 gap-3 pb-5 last:pb-0" key={item.id}>
                              <PersonAvatar className="size-9 shrink-0 text-[12px]" name={actorKey === "actorSelf" ? userDisplayName(subject) : t(`adminUsers.history.${actorKey}`)} tone="peach" />
                              {index < dayEvents.length - 1 ? <span aria-hidden className="absolute -bottom-0.5 left-[17px] top-[40px] w-px bg-border" data-testid="history-connector" /> : null}
                              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="flex min-w-0 items-baseline justify-between gap-3">
                                  <p className="min-w-0 wrap-anywhere text-[15px] text-foreground"><strong>{t(`adminUsers.history.${actorKey}`)}</strong> {t(`adminUsers.history.verb.${item.action}`, { defaultValue: item.action })}</p>
                                  <time className="shrink-0 text-[13px] text-muted-foreground" dateTime={item.occurredAt}>{formatTimeIct(item.occurredAt)}</time>
                                </div>
                                {chips.length > 0 ? (
                                  <ul className="flex flex-wrap gap-1.5">
                                    {chips.map((chip) => (
                                      <li className="max-w-full truncate rounded-full border border-border bg-muted px-2.5 py-0.5 text-[12px] text-foreground" key={chip.field} title={chipText(chip)}>
                                        {chipText(chip)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                                {item.reason ? <ClampedText className="text-[13px] text-muted-foreground" label={<b className="text-foreground">{t("adminUsers.suspension.reasonLabel")}</b>} text={item.reason} /> : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <span className="text-[13px] text-muted-foreground">{t("adminUsers.history.showing", { count: events.length, total })}</span>
                {feed.hasNextPage ? <Button disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()} type="button" variant="outline">{t("adminUsers.history.older")}</Button> : null}
              </div>
            </div>
          ) : null}
        </div>

        <section aria-label={t("adminUsers.history.filterTitle")} className="flex min-w-0 flex-col gap-5 surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">{t("adminUsers.history.filterTitle")}</h2>
            <button className="rounded-md text-[13px] font-semibold text-fg-link underline-offset-4 hover:underline" onClick={() => setParams({}, { replace: true })} type="button">{t("adminUsers.history.resetShort")}</button>
          </div>
          <fieldset className="flex flex-col gap-2.5">
            <legend className={`mb-2.5 ${SECTION_LABEL_CLASS}`}>{t("adminUsers.history.eventType")}</legend>
            {HISTORY_GROUPS.map((value: HistoryGroup) => (
              <label className={FIELD_CLASS} key={value}>
                <input checked={checkedGroups.includes(value)} className={CONTROL_CLASS} onChange={(event) => toggleGroup(value, event.target.checked)} type="checkbox" />
                {t(`adminUsers.history.group.${value}`)}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2.5">
            <legend className={`mb-2.5 ${SECTION_LABEL_CLASS}`}>{t("adminUsers.history.doneBy")}</legend>
            <label className={FIELD_CLASS}>
              <input checked={!actor} className={CONTROL_CLASS} name="history-actor" onChange={() => setParam(PARAMS.actor, undefined)} type="radio" />
              {t("adminUsers.history.anyone")}
            </label>
            {HISTORY_ACTORS.map((value: HistoryActor) => (
              <label className={FIELD_CLASS} key={value}>
                <input checked={actor === value} className={CONTROL_CLASS} name="history-actor" onChange={() => setParam(PARAMS.actor, value)} type="radio" />
                {t(`adminUsers.history.actor.${value}`)}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-2.5">
            <p className={SECTION_LABEL_CLASS}>{t("adminUsers.history.dateRange")}</p>
            <div className="flex flex-col gap-3">
              <FormField htmlFor="history-from" label={t("adminUsers.history.from")}>
                <DatePicker aria-invalid={rangeError === "order"} clearable id="history-from" onChange={(value) => setParam(PARAMS.from, value)} value={from} />
              </FormField>
              <FormField htmlFor="history-to" label={t("adminUsers.history.to")}>
                <DatePicker aria-invalid={rangeError === "span"} clearable id="history-to" onChange={(value) => setParam(PARAMS.to, value)} value={to} />
              </FormField>
            </div>
            {rangeError ? <p className="text-[12.5px] leading-normal text-danger" role="alert">{t(rangeError === "order" ? "adminUsers.history.rangeOrder" : "adminUsers.history.rangeSpan")}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
