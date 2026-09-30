import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
} from "@/api/generated/types.gen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EnterpriseStatusBadge,
  formatEnterpriseId,
} from "./enterprise-badges";
import {
  useCreateEnterpriseMutation,
  useEnterpriseDetailQuery,
  useUpdateEnterpriseMutation,
} from "./enterprises.queries";
import { useToast } from "@/components/toast/toast-provider";

function useSafeToast() {
  try {
    return useToast();
  } catch {
    return null;
  }
}

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

const COMPANY_TYPES = [
  "Product",
  "Outsourcing",
  "IT Service",
  "Consulting",
  "Agency",
  "Hybrid",
  "Other",
] as const;

const POPULAR_INDUSTRIES = [
  "Information Technology",
  "Fintech",
  "Cloud & DevOps",
  "Data & AI",
  "Software",
  "IT Services",
  "Consulting",
  "E-Commerce",
  "Telecommunications",
];

const POPULAR_CITIES = [
  "Hanoi",
  "Ho Chi Minh",
  "Da Nang",
  "Can Tho",
  "Hai Phong",
];

type TagInputProps = {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
};

function TagInput({ label, tags, onChange, placeholder = "Type and press Enter" }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim().replace(/^,+|,+$/g, "");
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((t) => t !== tagToRemove));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13.5px] font-semibold text-[#19191c]">{label}</span>
      <div className="min-h-[46px] p-2 rounded-xl border border-[#dedcd6] bg-white flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f1efea] text-[#4a4a50] text-xs font-semibold"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-[#64646b] hover:text-[#19191c] p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm text-[#19191c] outline-none bg-transparent placeholder:text-[#64646b] px-1"
        />
      </div>
    </div>
  );
}

export function EnterpriseFormPage() {
  const { enterpriseId } = useParams<{ enterpriseId?: string }>();
  const isEditMode = Boolean(enterpriseId);
  const navigate = useNavigate();
  const toast = useSafeToast();

  const detailQuery = useEnterpriseDetailQuery(enterpriseId);
  const createMutation = useCreateEnterpriseMutation();
  const updateMutation = useUpdateEnterpriseMutation(enterpriseId ?? "");

  // Form State
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("Information Technology");
  const [companyType, setCompanyType] = useState<string>("Product");
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState<(typeof COMPANY_SIZES)[number]>("51-200");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("Hanoi");
  const [stateProvince, setStateProvince] = useState("");
  const [country, setCountry] = useState("Vietnam");
  const [postalCode, setPostalCode] = useState("");
  const [branches, setBranches] = useState<
    Array<{ street: string; district?: string; city: string; country: string }>
  >([]);

  // Public Profile State
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [cultureSummary, setCultureSummary] = useState("");
  const [workingDays, setWorkingDays] = useState("Mon – Fri");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);

  // Confirmation checkbox (Create mode)
  const [confirmedVetting, setConfirmedVetting] = useState(false);

  // Errors & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate data in edit mode
  useEffect(() => {
    if (isEditMode && detailQuery.data) {
      const data = detailQuery.data;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(data.name || "");
      setLegalName(data.legalName || "");
      setTaxCode(data.taxCode || "");
      setRegistrationNumber(data.registrationNumber || "");
      setFoundedYear(data.foundedYear ?? "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setWebsite(data.website || "");
      setIndustry(data.industry || "Information Technology");
      setCompanyType(data.companyType || "Product");
      setSubIndustries(data.subIndustries || []);
      if (data.companySize && (COMPANY_SIZES as readonly string[]).includes(data.companySize)) {
        setCompanySize(data.companySize as (typeof COMPANY_SIZES)[number]);
      }
      if (data.address) {
        setStreet(data.address.street || "");
        setDistrict(data.address.district || "");
        setCity(data.address.city || "Hanoi");
        setStateProvince(data.address.state_province || "");
        setCountry(data.address.country || "Vietnam");
        setPostalCode(data.address.postal_code || "");
      }
      if (data.branches) {
        setBranches(
          data.branches.map((b) => ({
            street: b.street,
            district: b.district,
            city: b.city,
            country: b.country,
          })),
        );
      }
      setLogoUrl(data.logoUrl || "");
      setCoverUrl(data.coverUrl || "");
      setShortDescription(data.shortDescription || "");
      setDescription(data.description || "");
      setCultureSummary(data.cultureSummary || "");
      setWorkingDays(data.workingDays || "Mon – Fri");
      setBenefits(data.benefits || []);
      setTechStack(data.techStack || []);
      if (data.socialLinks) {
        setLinkedin(data.socialLinks.linkedin || "");
        setFacebook(data.socialLinks.facebook || "");
        setGithub(data.socialLinks.github || "");
        setTwitter(data.socialLinks.twitter || "");
      }
      if (data.mediaGallery) {
        setMediaGallery(data.mediaGallery);
      }
    }
  }, [isEditMode, detailQuery.data]);

  // Validation checks
  const isNameValid = name.trim().length >= 2;
  const isTaxCodeValid = /^\d{10,13}$/.test(taxCode.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = /^[0-9+() -]{8,20}$/.test(phone.trim());
  const isStreetValid = street.trim().length >= 1;
  const isCityValid = city.trim().length >= 1;
  const isCountryValid = country.trim().length >= 1;

  function addBranch() {
    setBranches([
      ...branches,
      { street: "", district: "", city: "Ho Chi Minh", country: "Vietnam" },
    ]);
  }

  function removeBranch(index: number) {
    setBranches(branches.filter((_, i) => i !== index));
  }

  function updateBranch(
    index: number,
    field: "street" | "district" | "city" | "country",
    val: string,
  ) {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: val };
    setBranches(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const newErrors: Record<string, string> = {};
    if (!isNameValid) newErrors.name = "Company name must be at least 2 characters";
    if (!isEditMode && !isTaxCodeValid) newErrors.tax_code = "Tax code must be 10 to 13 numeric digits";
    if (!isEmailValid) newErrors.email = "Please enter a valid corporate email address";
    if (!isPhoneValid) newErrors.phone = "Phone number must be 8 to 20 digits";
    if (!isStreetValid) newErrors.street = "Street address is required";
    if (!isCityValid) newErrors.city = "City is required";
    if (!isCountryValid) newErrors.country = "Country is required";
    if (!isEditMode && !confirmedVetting) {
      newErrors.vetting = "You must confirm offline legal and tax vetting before creating.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      const validationSummary = "Please resolve the highlighted validation errors.";
      setErrorMessage(validationSummary);
      toast?.showToast({
        tone: "error",
        title: "Validation error",
        message: validationSummary,
        note: Object.values(newErrors)[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const social_links = {
        ...(linkedin.trim() ? { linkedin: linkedin.trim() } : {}),
        ...(facebook.trim() ? { facebook: facebook.trim() } : {}),
        ...(github.trim() ? { github: github.trim() } : {}),
        ...(twitter.trim() ? { twitter: twitter.trim() } : {}),
      };

      const addressPayload = {
        street: street.trim(),
        district: district.trim() || undefined,
        city: city.trim(),
        state_province: stateProvince.trim() || undefined,
        country: country.trim(),
        postal_code: postalCode.trim() || undefined,
      };

      const validBranches = branches
        .filter((b) => b.street.trim() && b.city.trim())
        .map((b) => ({
          street: b.street.trim(),
          district: b.district?.trim() || undefined,
          city: b.city.trim(),
          country: b.country.trim() || "Vietnam",
        }));

      if (isEditMode) {
        const payload: UpdateEnterpriseDto = {
          name: name.trim(),
          legal_name: legalName.trim() || undefined,
          registration_number: registrationNumber.trim() || undefined,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          industry: industry.trim(),
          company_type: companyType as UpdateEnterpriseDto["company_type"],
          sub_industries: subIndustries.length > 0 ? subIndustries : undefined,
          company_size: companySize,
          founded_year: foundedYear ? Number(foundedYear) : undefined,
          address: addressPayload,
          branches: validBranches.length > 0 ? validBranches : undefined,
          logo_url: logoUrl.trim() || undefined,
          cover_url: coverUrl.trim() || undefined,
          short_description: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          culture_summary: cultureSummary.trim() || undefined,
          working_days: workingDays.trim() || undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          tech_stack: techStack.length > 0 ? techStack : undefined,
          social_links: Object.keys(social_links).length > 0 ? social_links : undefined,
          media_gallery: mediaGallery.length > 0 ? mediaGallery : undefined,
        };

        await updateMutation.mutateAsync(payload);
        toast?.showToast({
          tone: "success",
          title: "Profile updated",
          message: `Enterprise details have been successfully updated.`,
        });
        navigate(`/admin/enterprises/${enterpriseId}`);
      } else {
        const payload: CreateEnterpriseDto = {
          name: name.trim(),
          legal_name: legalName.trim() || undefined,
          tax_code: taxCode.trim(),
          registration_number: registrationNumber.trim() || undefined,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          industry: industry.trim(),
          company_type: companyType as CreateEnterpriseDto["company_type"],
          sub_industries: subIndustries.length > 0 ? subIndustries : undefined,
          company_size: companySize,
          founded_year: foundedYear ? Number(foundedYear) : undefined,
          address: addressPayload,
          branches: validBranches.length > 0 ? validBranches : undefined,
          logo_url: logoUrl.trim() || undefined,
          cover_url: coverUrl.trim() || undefined,
          short_description: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          culture_summary: cultureSummary.trim() || undefined,
          working_days: workingDays.trim() || undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          tech_stack: techStack.length > 0 ? techStack : undefined,
          social_links: Object.keys(social_links).length > 0 ? social_links : undefined,
          media_gallery: mediaGallery.length > 0 ? mediaGallery : undefined,
        };

        const res = (await createMutation.mutateAsync(payload)) as { id?: string };
        toast?.showToast({
          tone: "success",
          title: "Enterprise created",
          message: `Enterprise profile "${name.trim()}" created successfully.`,
        });
        if (res?.id) {
          navigate(`/admin/enterprises/${res.id}`);
        } else {
          navigate("/admin/enterprises");
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { status?: number; statusCode?: number; data?: { message?: string }; message?: string };
      const status = errorObj?.status ?? errorObj?.statusCode;
      const responseData = errorObj?.data ?? errorObj;
      const message = responseData?.message || errorObj?.message || "An unexpected error occurred.";

      if (status === 409) {
        let conflictMsg = message;
        if (message.toLowerCase().includes("tax") || message.toLowerCase().includes("tax_code")) {
          conflictMsg = "This tax code already belongs to another registered enterprise.";
          setFieldErrors({
            tax_code: conflictMsg,
          });
        } else if (message.toLowerCase().includes("email")) {
          conflictMsg = "This corporate email address is already in use by another enterprise.";
          setFieldErrors({
            email: conflictMsg,
          });
        } else if (message.toLowerCase().includes("own") || message.toLowerCase().includes("account")) {
          conflictMsg = "This account already owns an enterprise profile. Limit is 1 enterprise per user.";
          setErrorMessage(conflictMsg);
        } else {
          setErrorMessage(message);
        }
        toast?.showToast({
          tone: "error",
          title: "Conflict error (409)",
          message: conflictMsg,
        });
      } else {
        setErrorMessage(message);
        toast?.showToast({
          tone: "error",
          title: "Submission failed",
          message: message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEditMode && detailQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="w-48 h-6 rounded" />
        <Skeleton className="w-96 h-8 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <Skeleton className="h-[600px] rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const currentEnt = detailQuery.data;

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-[#64646b]">
        <Link
          to="/admin/enterprises"
          className="hover:text-[#19191c] transition flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Enterprise Profiles
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono font-semibold text-[#19191c]">
          {isEditMode ? `${formatEnterpriseId(enterpriseId)} / Edit` : "New"}
        </span>
      </nav>

      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#19191c]">
          {isEditMode ? "Edit enterprise profile" : "Create enterprise profile"}
        </h1>
        <p className="text-sm text-[#64646b]">
          {isEditMode
            ? "Changes are recorded in the audit history. Fields marked * are required."
            : "For a company that passed offline legal and tax vetting. Fields marked * are required."}
        </p>
      </div>

      {/* Conflict / General Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#fbe9e7] border border-[#f2c4bc] text-sm text-[#b42318] flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Form (left) & Summary Card (right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        {/* Form Sections */}
        <div className="flex flex-col gap-6">
          {/* Section 1: Legal Identity */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
                Legal identity
              </h2>
              <span className="text-xs text-[#64646b]">
                Must match company documentation checked during vetting.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display name */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Display name <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nova Fintech, FPT Software"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.name ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                <span className="text-xs text-[#64646b]">Shown on the public marketplace · 2–150 characters</span>
                {fieldErrors.name && <span className="text-xs text-[#b42318] font-medium">{fieldErrors.name}</span>}
              </div>

              {/* Legal name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Legal name</label>
                <input
                  type="text"
                  placeholder="Công ty Cổ phần ..."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <span className="text-xs text-[#64646b]">Optional · Official legal entity name</span>
              </div>

              {/* Tax Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Tax code <span className="text-[#d92d20]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isEditMode}
                    placeholder="10–13 numeric digits"
                    value={taxCode}
                    onChange={(e) => {
                      setTaxCode(e.target.value);
                      if (fieldErrors.tax_code) setFieldErrors({ ...fieldErrors, tax_code: "" });
                    }}
                    className={`h-11 px-3.5 w-full rounded-xl border text-sm font-mono outline-none transition ${
                      isEditMode
                        ? "bg-[#f6f5f1] text-[#4a4a50] cursor-not-allowed border-[#dedcd6]"
                        : fieldErrors.tax_code
                          ? "border-[#d92d20] bg-white focus:ring-2 focus:ring-rose-200"
                          : "border-[#dedcd6] bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                  {isEditMode && (
                    <Lock className="w-4 h-4 text-[#64646b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                <span className="text-xs text-[#64646b]">
                  {isEditMode ? "Locked after creation · 10–13 digits" : "10–13 numeric digits · must be unique"}
                </span>
                {fieldErrors.tax_code && (
                  <span className="text-xs text-[#b42318] font-medium">{fieldErrors.tax_code}</span>
                )}
              </div>

              {/* Registration Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Registration number</label>
                <input
                  type="text"
                  placeholder="Optional certificate number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {/* Founded Year */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Founded year</label>
                <input
                  type="number"
                  placeholder="e.g. 2016"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Contact */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">Contact</h2>
              <span className="text-xs text-[#64646b]">
                The corporate email and tax code must be unique across the platform.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Corporate email <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="hr@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.email ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                <span className="text-xs text-[#64646b]">Must be unique · stored in lowercase</span>
                {fieldErrors.email && (
                  <span className="text-xs text-[#b42318] font-medium">{fieldErrors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Phone <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="028 3822 1100"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.phone ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                <span className="text-xs text-[#64646b]">8–20 digits</span>
                {fieldErrors.phone && (
                  <span className="text-xs text-[#b42318] font-medium">{fieldErrors.phone}</span>
                )}
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Website</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Business Details */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">Business</h2>
              <span className="text-xs text-[#64646b]">
                Used for search and taxonomy filters in the directory.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Industry */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Industry <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  list="industry-list"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Select or enter industry"
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <datalist id="industry-list">
                  {POPULAR_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} />
                  ))}
                </datalist>
              </div>

              {/* Company Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Company type</label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                >
                  {COMPANY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-industries tags */}
            <TagInput
              label="Sub-industries"
              tags={subIndustries}
              onChange={setSubIndustries}
              placeholder="e.g. Payments, Digital Banking, AI, Big Data (Type & press Enter)"
            />

            {/* Company Size Pills */}
            <div className="flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-[#19191c]">
                Company size <span className="text-[#d92d20]">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((size) => {
                  const isSelected = companySize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      className={`h-10 px-4 rounded-xl text-sm font-semibold border transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#19191c] text-white border-[#19191c]"
                          : "bg-white text-[#64646b] border-[#dedcd6] hover:bg-[#fafaf8]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 4: Headquarters & Branches */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
                Headquarters address
              </h2>
              <span className="text-xs text-[#64646b]">Street, city and country are mandatory.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Street address <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Number, street name, ward"
                  value={street}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    if (fieldErrors.street) setFieldErrors({ ...fieldErrors, street: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.street ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                {fieldErrors.street && <span className="text-xs text-[#b42318] font-medium">{fieldErrors.street}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">District</label>
                <input
                  type="text"
                  placeholder="Optional district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  City <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  list="city-list"
                  type="text"
                  placeholder="Select city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.city ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                <datalist id="city-list">
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {fieldErrors.city && <span className="text-xs text-[#b42318] font-medium">{fieldErrors.city}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">State / Province</label>
                <input
                  type="text"
                  placeholder="Optional state"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">
                  Country <span className="text-[#d92d20]">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (fieldErrors.country) setFieldErrors({ ...fieldErrors, country: "" });
                  }}
                  className={`h-11 px-3.5 rounded-xl border bg-white text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.country ? "border-[#d92d20] focus:border-[#d92d20]" : "border-[#dedcd6] focus:border-primary"
                  }`}
                />
                {fieldErrors.country && <span className="text-xs text-[#b42318] font-medium">{fieldErrors.country}</span>}
              </div>
            </div>

            {/* Branches List */}
            {branches.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6f6f76]">
                  Branches
                </span>
                {branches.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#efede8] bg-[#fafaf8] flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#19191c]">Branch {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeBranch(idx)}
                        className="text-xs text-[#b42318] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Street"
                        value={b.street}
                        onChange={(e) => updateBranch(idx, "street", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[#dedcd6] bg-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="District"
                        value={b.district || ""}
                        onChange={(e) => updateBranch(idx, "district", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[#dedcd6] bg-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={b.city}
                        onChange={(e) => updateBranch(idx, "city", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[#dedcd6] bg-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Button
                type="button"
                variant="outline"
                onClick={addBranch}
                className="h-10 px-4 rounded-xl border-[#e6e4df] text-sm font-semibold gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add branch
              </Button>
            </div>
          </section>

          {/* Section 5: Public Profile */}
          <section className="p-6 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#19191c]">
                Public profile
              </h2>
              <span className="text-xs text-[#64646b]">
                Optional information shown on the public company marketplace page.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Cover image URL</label>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13.5px] font-semibold text-[#19191c]">Short description</label>
              <input
                type="text"
                placeholder="One line summary for company directory cards"
                maxLength={160}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <span className="text-xs text-[#64646b]">Up to 160 characters</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13.5px] font-semibold text-[#19191c]">Description</label>
              <textarea
                rows={4}
                placeholder="Detailed information about the enterprise, products, mission and engineering culture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Culture summary</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Small autonomous squads, continuous learning, demos"
                  value={cultureSummary}
                  onChange={(e) => setCultureSummary(e.target.value)}
                  className="p-3 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-y"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Working days & hours</label>
                <input
                  type="text"
                  placeholder="e.g. Monday – Friday (8:30 – 17:30)"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* Benefits & Tech Stack tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TagInput
                label="Benefits"
                tags={benefits}
                onChange={setBenefits}
                placeholder="e.g. 13th-month salary, Premium healthcare (Type & Enter)"
              />
              <TagInput
                label="Tech stack"
                tags={techStack}
                onChange={setTechStack}
                placeholder="e.g. React, TypeScript, Node.js, Go, AWS (Type & Enter)"
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">Facebook URL</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13.5px] font-semibold text-[#19191c]">X (Twitter) URL</label>
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-[#dedcd6] bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* Media Gallery Tag / URLs */}
            <TagInput
              label="Media gallery URLs"
              tags={mediaGallery}
              onChange={setMediaGallery}
              placeholder="Paste photo URL and press Enter"
            />
          </section>

          {/* Offline Vetting Confirmation (Create mode only) */}
          {!isEditMode && (
            <div className="flex flex-col gap-1.5">
              <section
                onClick={() => {
                  setConfirmedVetting(!confirmedVetting);
                  if (fieldErrors.vetting) setFieldErrors({ ...fieldErrors, vetting: "" });
                }}
                className={`p-5 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition select-none ${
                  fieldErrors.vetting
                    ? "bg-[#fff5f5] border-[#f2c4bc]"
                    : confirmedVetting
                      ? "bg-[#fef3ee] border-[#f0b4a0]"
                      : "bg-white border-[#dedcd6] hover:bg-[#fafaf8]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={confirmedVetting}
                  onChange={(e) => {
                    setConfirmedVetting(e.target.checked);
                    if (fieldErrors.vetting) setFieldErrors({ ...fieldErrors, vetting: "" });
                  }}
                  className="w-5 h-5 rounded-md mt-0.5 accent-[#b33305] cursor-pointer"
                />
                <div className="flex flex-col gap-1 text-[13.5px]">
                  <span className="font-bold text-[#19191c]">
                    I confirm the legal and tax vetting was completed offline{" "}
                    <span className="text-[#d92d20]">*</span>
                  </span>
                  <span className="text-xs text-[#4a4a50] leading-relaxed">
                    The enterprise is created as <strong>Active</strong> and becomes visible in the
                    directory immediately.
                  </span>
                </div>
              </section>
              {fieldErrors.vetting && (
                <span className="text-xs text-[#b42318] font-medium px-2">{fieldErrors.vetting}</span>
              )}
            </div>
          )}

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e6e4df]">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditMode ? `/admin/enterprises/${enterpriseId}` : "/admin/enterprises")}
              className="h-11 px-6 rounded-xl border-[#e6e4df] text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-7 rounded-xl bg-[#f2470c] hover:bg-[#d93d07] text-white text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create enterprise"}
            </Button>
          </div>
        </div>

        {/* Right Column: Guidance & System rules */}
        <aside className="flex flex-col gap-5 sticky top-6">
          {!isEditMode ? (
            <>
              {/* Required checklist */}
              <section className="p-5 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-3">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#6f6f76]">
                  REQUIRED TO CREATE
                </span>
                <ul className="flex flex-col gap-2.5 text-[13px] text-[#4a4a50]">
                  <li className="flex items-center gap-2.5">
                    {isNameValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Display name</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {isTaxCodeValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Tax code (10–13 digits)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {isEmailValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Corporate email</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {isPhoneValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Phone</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {isStreetValid && isCityValid && isCountryValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Headquarters address</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    {confirmedVetting ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#d73c03] shrink-0" />
                    )}
                    <span>Offline vetting confirmation</span>
                  </li>
                </ul>
              </section>

              {/* Set by system card */}
              <section className="p-5 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-2.5 text-xs text-[#4a4a50] leading-relaxed">
                <span className="font-bold uppercase tracking-wider text-[#6f6f76]">
                  SET BY THE SYSTEM
                </span>
                <p>
                  Status <strong>Active</strong>, creator ID, created time and enterprise ID are
                  assigned automatically by the platform.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Not editable here */}
              <section className="p-5 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex flex-col gap-2.5 text-xs text-[#4a4a50] leading-relaxed">
                <span className="font-bold uppercase tracking-wider text-[#6f6f76]">
                  NOT EDITABLE HERE
                </span>
                <p>
                  <strong className="text-[#19191c]">Tax code</strong> is permanently locked after
                  creation to maintain compliance and invoice integrity.
                </p>
                <p>
                  <strong className="text-[#19191c]">Status</strong> transitions are controlled via
                  Suspend or Activate actions on the detail page.
                </p>
              </section>

              {/* Current status card */}
              <section className="p-5 rounded-2xl bg-white border border-[#e6e4df] shadow-2xs flex items-center justify-between">
                <span className="text-xs text-[#64646b] font-medium">Current status</span>
                <EnterpriseStatusBadge status={currentEnt?.status} />
              </section>
            </>
          )}
        </aside>
      </form>
    </div>
  );
}
