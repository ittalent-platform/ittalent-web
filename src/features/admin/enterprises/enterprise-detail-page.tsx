import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CompanyTypeBadge,
  EnterpriseAvatar,
  EnterpriseStatusBadge,
  formatEnterpriseId,
} from "./enterprise-badges";
import {
  ActivateEnterpriseDialog,
  DeleteEnterpriseDialog,
  SuspendEnterpriseDialog,
} from "./enterprise-dialogs";
import {
  useDeleteEnterpriseMutation,
  useEnterpriseDetailQuery,
  useUpdateEnterpriseStatusMutation,
} from "./enterprises.queries";
import { useToast } from "@/components/toast/toast-provider";

function useSafeToast() {
  try {
    return useToast();
  } catch {
    return null;
  }
}

export function AdminEnterpriseDetailPage() {
  const { enterpriseId } = useParams<{ enterpriseId: string }>();
  const navigate = useNavigate();

  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const detailQuery = useEnterpriseDetailQuery(enterpriseId);
  const updateStatusMutation = useUpdateEnterpriseStatusMutation(enterpriseId ?? "");
  const deleteMutation = useDeleteEnterpriseMutation(enterpriseId ?? "");

  const ent = detailQuery.data;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  }

  const toast = useSafeToast();

  async function handleConfirmSuspend(reason: string) {
    if (!enterpriseId) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "suspended",
        reason,
      });
      showToast("Enterprise profile suspended");
      toast?.showToast({
        tone: "warning",
        title: "Enterprise suspended",
        message: `${ent?.name || "Enterprise"} has been suspended and hidden from public view.`,
      });
      setActionType(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to suspend enterprise";
      toast?.showToast({
        tone: "error",
        title: "Suspension failed",
        message: msg,
      });
      throw err;
    }
  }

  async function handleConfirmActivate(reason?: string) {
    if (!enterpriseId) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "active",
        reason: reason || "Enterprise activated by administrator",
      });
      showToast("Enterprise profile activated · Now public");
      toast?.showToast({
        tone: "success",
        title: "Enterprise activated",
        message: `${ent?.name || "Enterprise"} is now active and public.`,
      });
      setActionType(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to activate enterprise";
      toast?.showToast({
        tone: "error",
        title: "Activation failed",
        message: msg,
      });
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (!enterpriseId) return;
    try {
      await deleteMutation.mutateAsync();
      showToast("Enterprise profile deleted");
      toast?.showToast({
        tone: "error",
        title: "Enterprise deleted",
        message: `${ent?.name || "Enterprise"} has been soft-deleted.`,
      });
      setActionType(null);
      navigate("/admin/enterprises");
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to delete enterprise";
      toast?.showToast({
        tone: "error",
        title: "Deletion failed",
        message: msg,
      });
      throw err;
    }
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="w-48 h-6 rounded" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="w-64 h-7 rounded" />
            <Skeleton className="w-40 h-4 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !ent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-4 bg-white rounded-2xl border border-[#e6e4df]">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-[#19191c]">
          Enterprise not found
        </h2>
        <p className="text-sm text-[#64646b]">
          The requested enterprise profile could not be found or you may not have access to view it.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/enterprises")}
          className="rounded-xl border-[#e6e4df]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Enterprise Profiles
        </Button>
      </div>
    );
  }

  const formattedId = formatEnterpriseId(ent.id);
  const isActive = ent.status?.toLowerCase() === "active";

  const locationString = ent.address
    ? `${ent.address.city}${ent.address.country ? `, ${ent.address.country}` : ""}`
    : null;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#19191c] text-white text-sm shadow-2xl animate-in fade-in slide-in-from-bottom-3"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-[#64646b]">
        <Link
          to="/admin/enterprises"
          className="hover:text-[#19191c] transition flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Enterprise Profiles
        </Link>
        <span aria-hidden="true" className="text-muted-foreground/50">/</span>
        <span className="font-mono font-semibold text-[#19191c]">{formattedId}</span>
      </nav>

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e6e4df] shadow-2xs">
        <div className="flex items-center gap-4 min-w-0">
          <EnterpriseAvatar name={ent.name} logoUrl={ent.logoUrl} size="lg" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#19191c] truncate">
                {ent.name}
              </h1>
              <EnterpriseStatusBadge status={ent.status} />
              {ent.companyType ? <CompanyTypeBadge type={ent.companyType} /> : null}
            </div>
            <span className="text-xs text-[#64646b] flex flex-wrap items-center gap-2">
              <span>{ent.email}</span>
              <span>·</span>
              <span>{ent.industry}</span>
              {locationString && (
                <>
                  <span>·</span>
                  <span>{locationString}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={`/admin/enterprises/${ent.id}/edit`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#e6e4df] bg-white hover:bg-muted/40 text-sm font-semibold text-[#19191c] transition"
          >
            <Pencil className="w-4 h-4 text-[#64646b]" />
            <span>Edit</span>
          </Link>

          {isActive ? (
            <Button
              type="button"
              onClick={() => setActionType("suspend")}
              className="h-10 px-4 rounded-xl bg-[#c62a1c] hover:bg-[#b02215] text-white text-sm font-semibold gap-2 shadow-xs"
            >
              <Ban className="w-4 h-4" />
              <span>Suspend</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setActionType("activate")}
              className="h-10 px-4 rounded-xl bg-[#12764a] hover:bg-[#0f603c] text-white text-sm font-semibold gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Activate</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setActionType("delete")}
            className="h-10 px-3 rounded-xl border-[#e6e4df] text-[#b42318] hover:bg-rose-50"
            title="Delete enterprise"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Legal Identity Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Legal identity
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13.5px]">
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Display name</dt>
                <dd className="font-semibold text-[#19191c]">{ent.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Legal name</dt>
                <dd className="font-semibold text-[#19191c]">{ent.legalName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Tax code</dt>
                <dd className="font-mono font-semibold text-[#19191c] text-sm">
                  {ent.taxCode ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Registration number</dt>
                <dd className="font-semibold text-[#19191c]">{ent.registrationNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Founded year</dt>
                <dd className="font-semibold text-[#19191c]">{ent.foundedYear ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Enterprise ID</dt>
                <dd className="font-mono font-semibold text-[#19191c] text-xs">
                  {formattedId} <span className="text-[#64646b] font-normal">({ent.id})</span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Contact Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Contact
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13.5px]">
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Corporate email</dt>
                <dd className="font-semibold text-[#19191c] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#64646b]" />
                  <a href={`mailto:${ent.email}`} className="text-primary hover:underline">
                    {ent.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Phone</dt>
                <dd className="font-semibold text-[#19191c] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#64646b]" />
                  <span>{ent.phone}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Website</dt>
                <dd className="font-semibold text-[#19191c]">
                  {ent.website ? (
                    <a
                      href={ent.website.startsWith("http") ? ent.website : `https://${ent.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{ent.website.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="w-3 h-3 text-[#64646b]" />
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Social links</dt>
                <dd className="font-semibold text-xs flex flex-wrap gap-2 text-primary">
                  {ent.socialLinks?.linkedin && (
                    <a
                      href={ent.socialLinks.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {ent.socialLinks?.facebook && (
                    <a
                      href={ent.socialLinks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                  {ent.socialLinks?.github && (
                    <a
                      href={ent.socialLinks.github}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {ent.socialLinks?.twitter && (
                    <a
                      href={ent.socialLinks.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Twitter
                    </a>
                  )}
                  {!ent.socialLinks || Object.values(ent.socialLinks).every((v) => !v) ? "—" : null}
                </dd>
              </div>
            </dl>
          </section>

          {/* Business Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Business
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13.5px]">
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Industry</dt>
                <dd className="font-semibold text-[#19191c]">{ent.industry}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Company size</dt>
                <dd className="font-semibold text-[#19191c]">{ent.companySize} employees</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Company type</dt>
                <dd className="font-semibold text-[#19191c]">{ent.companyType ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64646b] font-medium mb-1">Working days</dt>
                <dd className="font-semibold text-[#19191c]">{ent.workingDays ?? "Mon – Fri"}</dd>
              </div>
              {ent.subIndustries && ent.subIndustries.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#64646b] font-medium mb-2">Sub-industries</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {ent.subIndustries.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#f1efea] text-[#4a4a50] text-xs font-semibold"
                      >
                        {sub}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Addresses Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-4">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Addresses
            </h2>
            {/* Headquarters */}
            {ent.address && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#efede8] bg-[#fafaf8]">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 text-[13.5px]">
                  <span className="font-bold text-[#19191c]">Headquarters</span>
                  <span className="text-[#4a4a50] leading-relaxed">
                    {ent.address.street}
                    {ent.address.district ? `, ${ent.address.district}` : ""}
                    <br />
                    {ent.address.city}, {ent.address.country}
                    {ent.address.postal_code ? ` · ${ent.address.postal_code}` : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Branches */}
            {ent.branches &&
              ent.branches.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#efede8] bg-[#fafaf8]"
                >
                  <MapPin className="w-4 h-4 text-[#64646b] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-[13.5px]">
                    <span className="font-bold text-[#19191c]">Branch {idx + 1}</span>
                    <span className="text-[#4a4a50] leading-relaxed">
                      {b.street}
                      {b.district ? `, ${b.district}` : ""}
                      <br />
                      {b.city}, {b.country}
                      {b.postal_code ? ` · ${b.postal_code}` : ""}
                    </span>
                  </div>
                </div>
              ))}
          </section>

          {/* Public Profile Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Public profile
            </h2>

            {/* Cover Banner */}
            <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-r from-[#19191c] via-[#3a2a24] to-[#f2470c]">
              {ent.coverUrl && (
                <img
                  src={ent.coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute left-4 -bottom-4 p-1 rounded-2xl bg-white shadow-md">
                <EnterpriseAvatar name={ent.name} logoUrl={ent.logoUrl} size="lg" />
              </div>
            </div>

            <div className="h-2" />

            {/* Descriptions */}
            {ent.shortDescription && (
              <div>
                <span className="text-xs text-[#64646b] font-medium block mb-1">
                  Short description
                </span>
                <p className="font-medium text-[#19191c] text-sm leading-relaxed">
                  {ent.shortDescription}
                </p>
              </div>
            )}

            {ent.description && (
              <div>
                <span className="text-xs text-[#64646b] font-medium block mb-1">
                  About the company
                </span>
                <p className="text-[#4a4a50] text-sm leading-relaxed whitespace-pre-line">
                  {ent.description}
                </p>
              </div>
            )}

            {ent.cultureSummary && (
              <div>
                <span className="text-xs text-[#64646b] font-medium block mb-1">Culture</span>
                <p className="text-[#4a4a50] text-sm leading-relaxed">{ent.cultureSummary}</p>
              </div>
            )}

            {/* Benefits & Tech Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {ent.benefits && ent.benefits.length > 0 && (
                <div>
                  <span className="text-xs text-[#64646b] font-medium block mb-2">Benefits</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ent.benefits.map((b, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#f1efea] text-[#4a4a50] text-xs font-semibold"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ent.techStack && ent.techStack.length > 0 && (
                <div>
                  <span className="text-xs text-[#64646b] font-medium block mb-2">Tech stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ent.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#f1efea] text-[#4a4a50] text-xs font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Media Gallery */}
            {ent.mediaGallery && ent.mediaGallery.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-[#64646b] font-medium block mb-2">
                  Media gallery · {ent.mediaGallery.length}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {ent.mediaGallery.map((imgUrl, i) => (
                    <a
                      key={i}
                      href={imgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-24 rounded-xl overflow-hidden border border-[#e6e4df] hover:opacity-90 transition"
                    >
                      <img
                        src={imgUrl}
                        alt={`Gallery ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar Column */}
        <div className="flex flex-col gap-6 sticky top-6">
          {/* Status Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-4">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">Status</h2>
            <div className="flex items-center gap-2.5">
              <EnterpriseStatusBadge status={ent.status} />
              <span className="text-xs text-[#64646b]">
                Updated {new Date(ent.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {ent.statusReason && (
              <div className="p-3 rounded-xl bg-[#fafaf8] border border-[#efede8] text-xs text-[#4a4a50] leading-relaxed">
                <strong>Status Reason:</strong> {ent.statusReason}
              </div>
            )}

            <p className="text-xs text-[#64646b] leading-relaxed">
              Active enterprises are displayed on the public site and can post recruitment jobs.
              Suspending immediately hides the profile and job postings.
            </p>
          </section>

          {/* Company Admin Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-4">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Account Owner
            </h2>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-[#e4ecfb] text-[#2a55a8] font-bold text-sm flex items-center justify-center">
                AC
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[#64646b]">Creator Account ID</span>
                <span className="font-mono text-xs font-semibold text-[#19191c] truncate">
                  {ent.creatorAccountId}
                </span>
              </div>
            </div>
          </section>

          {/* Job Postings Summary Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-4">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
              Job postings
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl border border-[#e6e4df] bg-[#fafaf8]">
                <span className="block text-xl font-bold font-['Space_Grotesk'] text-[#19191c]">
                  {ent.activeJobsCount ?? 0}
                </span>
                <span className="text-xs text-[#64646b]">Active</span>
              </div>
              <div className="p-3 rounded-xl border border-[#e6e4df] bg-[#fafaf8]">
                <span className="block text-xl font-bold font-['Space_Grotesk'] text-[#19191c]">
                  0
                </span>
                <span className="text-xs text-[#64646b]">Draft</span>
              </div>
              <div className="p-3 rounded-xl border border-[#e6e4df] bg-[#fafaf8]">
                <span className="block text-xl font-bold font-['Space_Grotesk'] text-[#19191c]">
                  0
                </span>
                <span className="text-xs text-[#64646b]">Closed</span>
              </div>
            </div>
          </section>

          {/* Record Metadata Card */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-3 text-xs">
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c] mb-1">
              Record
            </h2>
            <div className="flex justify-between items-center py-1 border-b border-[#efede8]">
              <span className="text-[#64646b]">Created date</span>
              <span className="font-semibold text-[#19191c]">
                {new Date(ent.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#64646b]">Last updated</span>
              <span className="font-semibold text-[#19191c]">
                {new Date(ent.updatedAt).toLocaleString()}
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Action Dialogs */}
      {actionType === "suspend" && (
        <SuspendEnterpriseDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleConfirmSuspend}
          enterpriseName={ent.name}
          activeJobsCount={ent.activeJobsCount}
        />
      )}

      {actionType === "activate" && (
        <ActivateEnterpriseDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleConfirmActivate}
          enterpriseName={ent.name}
          previousReason={ent.statusReason}
        />
      )}

      {actionType === "delete" && (
        <DeleteEnterpriseDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleConfirmDelete}
          enterpriseName={ent.name}
        />
      )}
    </div>
  );
}
