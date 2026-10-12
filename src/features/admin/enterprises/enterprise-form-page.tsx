import { type RefObject, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  Check,
  ImageIcon,
  Lock,
  Plus,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { HTTP_CONFLICT } from "@/api/http-status";
import type { RequestError } from "@/api/request-error";
import type {
  CreateEnterpriseDto,
  EnterpriseDetailDto,
  UpdateEnterpriseDto,
} from "@/api/generated/types.gen";
import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { FormField, FormFieldLabel, FormFieldMessage } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/toast/toast-provider";
import {
  COMPANY_SIZE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  CITY_OPTIONS,
  COUNTRY_OPTIONS,
} from "./enterprises.constants";
import {
  SAVE_FAILED,
  useCreateEnterpriseMutation,
  useEnterpriseDetailQuery,
  useUpdateEnterpriseMutation,
} from "./enterprises.queries";
import { EnterpriseStatusBadge, formatEnterpriseId } from "./enterprise-badges";
import { SectionCard } from "@/components/common/section-card";

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

  function addCurrent() {
    const val = inputValue.trim().replace(/^,+|,+$/g, "");
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInputValue("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <FormFieldLabel className="mb-0">{label}</FormFieldLabel>
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-card min-h-[46px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
        {tags.map((tag) => (
          <span
            key={tag}
            className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-surface-readonly dark:bg-muted text-foreground inline-flex items-center gap-1.5"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add another..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-1 px-1"
          />
          {inputValue.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addCurrent}
              className="h-7 px-2 text-xs"
            >
              <Plus className="size-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnterpriseFormPage() {
  const { enterpriseId } = useParams<{ enterpriseId?: string }>();
  const isEditMode = Boolean(enterpriseId);
  const detailQuery = useEnterpriseDetailQuery(isEditMode ? enterpriseId : undefined);

  if (isEditMode && detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-10 w-96 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <EnterpriseFormContent
      key={enterpriseId ? (detailQuery.data?.id ?? "edit") : "create"}
      enterpriseId={enterpriseId}
      initialData={detailQuery.data}
    />
  );
}

function EnterpriseFormContent({
  enterpriseId,
  initialData,
}: {
  enterpriseId?: string;
  initialData?: EnterpriseDetailDto;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditMode = Boolean(enterpriseId);

  const createMutation = useCreateEnterpriseMutation();
  const updateMutation = useUpdateEnterpriseMutation(enterpriseId || "");

  const initialAddr = initialData?.address as {
    street?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    postalCode?: string;
    country?: string;
  } | undefined;

  // Form states initialized directly from initialData
  const [name, setName] = useState(initialData?.name || "");
  const [legalName, setLegalName] = useState(initialData?.legalName || "");
  const [taxCode, setTaxCode] = useState(initialData?.taxCode || "");
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber || "");
  const [foundedYear, setFoundedYear] = useState<number | "">(initialData?.foundedYear ?? "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [companyAdminName, setCompanyAdminName] = useState("");
  const [companyAdminEmail, setCompanyAdminEmail] = useState("");
  const [companyAdminTitle, setCompanyAdminTitle] = useState("");
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [companyType, setCompanyType] = useState(initialData?.companyType || "");
  const [companySize, setCompanySize] = useState(initialData?.companySize || "");
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [street, setStreet] = useState(initialAddr?.street || "");
  const [district, setDistrict] = useState(initialAddr?.district || "");
  const [city, setCity] = useState(initialAddr?.city || "");
  const [stateProvince, setStateProvince] = useState("");
  const [postalCode, setPostalCode] = useState(initialAddr?.postal_code || initialAddr?.postalCode || "");
  const [country, setCountry] = useState(initialAddr?.country || "Vietnam");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [culture, setCulture] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || []);
  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack || []);
  const [vettingConfirmed, setVettingConfirmed] = useState(false);

  // Logo & Cover file uploads & previews
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || "");

  // Branches
  const [branches, setBranches] = useState<Array<{ street: string; city: string; country: string }>>(
    (initialData?.branches as Array<{ street: string; city: string; country: string }>) || []
  );
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchStreet, setBranchStreet] = useState("");
  const [branchCity, setBranchCity] = useState("Hà Nội");
  const [branchCountry, setBranchCountry] = useState("Vietnam");

  // Logo and cover are previewed (and sent) as data URLs, up to 2 MB each.
  function readImage(file: File, kind: "Logo" | "Cover", setUrl: (url: string) => void) {
    if (file.size > 2 * 1024 * 1024) {
      toast.showToast({
        tone: "error",
        title: "File too large",
        message: `${kind} image must be under 2 MB.`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleAddBranch() {
    if (!branchStreet.trim()) return;
    setBranches((prev) => [
      ...prev,
      {
        street: branchStreet.trim(),
        city: branchCity.trim(),
        country: branchCountry.trim(),
      },
    ]);
    setBranchStreet("");
    setIsAddingBranch(false);
  }

  function handleRemoveBranch(idx: number) {
    setBranches((prev) => prev.filter((_, i) => i !== idx));
  }

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Company name must be at least 2 characters.";
    }
    const cleanTax = taxCode.replace(/\s+/g, "");
    if (!cleanTax || !/^\d{10,13}$/.test(cleanTax)) {
      errs.taxCode = "Tax code must be 10 to 13 numeric digits.";
    }

    if (!email.trim()) {
      errs.email = "Corporate email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!phone.trim()) {
      errs.phone = "Phone number is required.";
    }

    if (!industry) {
      errs.industry = "Industry selection is required.";
    }

    if (!companySize) {
      errs.companySize = "Company size selection is required.";
    }

    if (!street.trim()) errs.street = "Street address is required.";
    if (!city.trim()) errs.city = "City is required.";
    if (!country.trim()) errs.country = "Country is required.";

    if (!isEditMode) {
      if (!companyAdminName.trim()) {
        errs.adminName = "Company admin full name is required.";
      }
      if (!companyAdminEmail.trim()) {
        errs.adminEmail = "Company admin work email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyAdminEmail)) {
        errs.adminEmail = "Please enter a valid work email.";
      }
      if (!vettingConfirmed) {
        errs.vetting = "You must confirm offline legal and tax vetting before creating.";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      setErrorMessage("Please complete all required fields highlighted below.");
      return;
    }

    const createPayload: CreateEnterpriseDto = {
      name: name.trim(),
      legal_name: legalName.trim() || undefined,
      tax_code: taxCode.replace(/\s+/g, "").trim(),
      registration_number: registrationNumber.trim() || undefined,
      founded_year: typeof foundedYear === "number" ? foundedYear : undefined,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      website: website.trim() || undefined,
      industry: industry.trim() || "Technology",
      company_type: (companyType || undefined) as CreateEnterpriseDto["company_type"],
      company_size: (companySize || "11-50") as CreateEnterpriseDto["company_size"],
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      tech_stack: techStack.length > 0 ? techStack : undefined,
      logo_url: logoUrl || undefined,
      cover_url: coverUrl || undefined,
      branches: branches.length > 0 ? branches : undefined,
      address: {
        street: street.trim() || "N/A",
        district: district.trim() || undefined,
        city: city.trim() || "Hồ Chí Minh",
        postal_code: postalCode.trim() || undefined,
        country: country.trim() || "Vietnam",
      },
    };

    try {
      if (isEditMode && enterpriseId) {
        const updatePayload: UpdateEnterpriseDto = {
          name: createPayload.name,
          legal_name: createPayload.legal_name,
          registration_number: createPayload.registration_number,
          founded_year: createPayload.founded_year,
          email: createPayload.email,
          phone: createPayload.phone,
          website: createPayload.website,
          industry: createPayload.industry,
          company_type: createPayload.company_type,
          company_size: createPayload.company_size,
          short_description: createPayload.short_description,
          description: createPayload.description,
          benefits: createPayload.benefits,
          tech_stack: createPayload.tech_stack,
          logo_url: createPayload.logo_url,
          cover_url: createPayload.cover_url,
          branches: createPayload.branches,
          address: createPayload.address,
        };

        await updateMutation.mutateAsync(updatePayload);
        toast.showToast({
          tone: "success",
          title: "Changes saved",
          message: `${name} was successfully updated.`,
        });
        navigate(`/admin/enterprises/${enterpriseId}`);
      } else {
        const res = await createMutation.mutateAsync(createPayload);
        toast.showToast({
          tone: "success",
          title: "Enterprise created",
          message: `${name} profile was registered as Active.`,
        });
        const newId = (res as { id?: string })?.id;
        if (newId) {
          navigate(`/admin/enterprises/${newId}`);
        } else {
          navigate("/admin/enterprises");
        }
      }
    } catch (err: unknown) {
      const { message, status } = err as RequestError;
      // A 409 without a server message still explains the usual cause.
      setErrorMessage(status === HTTP_CONFLICT && message === SAVE_FAILED
        ? "Tax code or corporate email already belongs to another enterprise. Please verify details."
        : message || SAVE_FAILED);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const clearError = (key: string) => {
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };
  const required = (key: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    clearError(key);
  };

  return (
    <div className="space-y-5">
      <div className="flex">
        <Breadcrumb
          ariaLabel="Breadcrumb"
          items={[
            { label: t("adminEnterprises.page.title", "Enterprise Profiles"), to: "/admin/enterprises" },
            { label: isEditMode ? `${formatEnterpriseId(enterpriseId)} / Edit` : "New", mono: true },
          ]}
        />
      </div>

      <AdminPageHeader
        description={isEditMode
          ? "Changes are saved to the audit log. Fields marked * are required."
          : "For a company that passed offline legal and tax vetting. Fields marked * are required."}
        title={isEditMode
          ? t("adminEnterprises.form.editTitle", "Edit enterprise profile")
          : t("adminEnterprises.form.createTitle", "Create enterprise profile")}
      />

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-(--danger-border) bg-(--danger-bg) text-(--danger-fg) text-sm">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Please resolve the highlighted validation errors before proceeding.</p>
            <p className="text-xs mt-1 text-(--danger-fg)/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          <div className="flex flex-col gap-[18px]">
            <SectionCard description="Must match the documents checked during offline vetting." title="Legal identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <FormField error={fieldErrors.name} hint="Shown on the public company page · 2–150 characters" htmlFor="company-name" label="Display name" required>
                  <Input aria-invalid={Boolean(fieldErrors.name)} id="company-name" onChange={(e) => required("name", setName)(e.target.value)} placeholder="Nova Fintech" value={name} />
                </FormField>
                <FormField hint="As on the business registration" htmlFor="legal-name" label="Legal name">
                  <Input id="legal-name" onChange={(e) => setLegalName(e.target.value)} placeholder="Công ty Cổ phần …" value={legalName} />
                </FormField>
                <FormField error={fieldErrors.taxCode} hint={isEditMode ? "Locked after creation · 10–13 digits" : "10–13 digits · must be unique"} htmlFor="tax-code" label="Tax code" required>
                  <div className="relative">
                    <Input
                      aria-invalid={Boolean(fieldErrors.taxCode)}
                      className={`font-mono ${isEditMode ? "pr-10" : ""}`}
                      disabled={isEditMode}
                      id="tax-code"
                      onChange={(e) => required("taxCode", setTaxCode)(e.target.value)}
                      placeholder="10–13 numeric digits"
                      value={taxCode}
                    />
                    {isEditMode && (
                      <span className="absolute right-3.5 top-3.5 text-muted-foreground">
                        <Lock className="size-4" />
                      </span>
                    )}
                  </div>
                </FormField>
                <FormField htmlFor="reg-number" label="Registration number">
                  <Input className="font-mono" id="reg-number" onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Optional" value={registrationNumber} />
                </FormField>
                <FormField hint="Between 1900 and this year" htmlFor="founded-year" label="Founded year">
                  <Input
                    className="font-mono"
                    id="founded-year"
                    max={new Date().getFullYear()}
                    min={1900}
                    onChange={(e) => setFoundedYear(e.target.value ? parseInt(e.target.value, 10) : "")}
                    placeholder="e.g. 2016"
                    type="number"
                    value={foundedYear}
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard description="The corporate email and tax code must not belong to another enterprise." title="Contact">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <FormField error={fieldErrors.email} hint="Must be unique · stored in lowercase" htmlFor="email" label="Corporate email" required>
                  <Input aria-invalid={Boolean(fieldErrors.email)} id="email" onChange={(e) => required("email", setEmail)(e.target.value)} placeholder="hr@company.vn" type="email" value={email} />
                </FormField>
                <FormField error={fieldErrors.phone} hint="8–20 digits" htmlFor="phone" label="Phone" required>
                  <Input aria-invalid={Boolean(fieldErrors.phone)} id="phone" onChange={(e) => required("phone", setPhone)(e.target.value)} placeholder="028 3822 1100" value={phone} />
                </FormField>
                <FormField htmlFor="website" label="Website">
                  <Input id="website" onChange={(e) => setWebsite(e.target.value)} placeholder="https://" type="url" value={website} />
                </FormField>
              </div>
            </SectionCard>

            {!isEditMode && (
              <SectionCard description="The first person who can sign in for this company. They get an invitation email to set a password." title="Company admin">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                  <FormField error={fieldErrors.adminName} htmlFor="admin-name" label="Full name" required>
                    <Input aria-invalid={Boolean(fieldErrors.adminName)} id="admin-name" onChange={(e) => required("adminName", setCompanyAdminName)(e.target.value)} placeholder="Tran Thi B" value={companyAdminName} />
                  </FormField>
                  <FormField error={fieldErrors.adminEmail} hint="Must not belong to another ITTalent account" htmlFor="admin-email" label="Work email" required>
                    <Input aria-invalid={Boolean(fieldErrors.adminEmail)} id="admin-email" onChange={(e) => required("adminEmail", setCompanyAdminEmail)(e.target.value)} placeholder="name@company.vn" type="email" value={companyAdminEmail} />
                  </FormField>
                  <FormField htmlFor="admin-title" label="Job title">
                    <Input id="admin-title" onChange={(e) => setCompanyAdminTitle(e.target.value)} placeholder="Optional" value={companyAdminTitle} />
                  </FormField>
                </div>
              </SectionCard>
            )}

            <SectionCard description="Used for filters on the public company list." title="Business">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <FormField error={fieldErrors.industry} hint="e.g. Information Technology, Fintech" htmlFor="industry-select" label="Industry" required>
                  <OptionSelect id="industry-select" onChange={required("industry", setIndustry)} options={INDUSTRY_OPTIONS} placeholder="Select industry..." value={industry} />
                </FormField>
                <FormField hint="Product, Outsourcing, IT Service, Consulting, Agency, Hybrid or Other" htmlFor="company-type-select" label="Company type">
                  <OptionSelect id="company-type-select" onChange={setCompanyType} options={COMPANY_TYPE_OPTIONS} placeholder="Select type..." value={companyType} />
                </FormField>
                <TagInput label="Sub-industries" onChange={setSubIndustries} placeholder="Type and press Enter" tags={subIndustries} />
              </div>

              <div className="flex flex-col gap-2">
                <FormFieldLabel className="mb-0" required>Company size</FormFieldLabel>
                <div role="group" className="flex flex-wrap gap-2">
                  {COMPANY_SIZE_OPTIONS.map((opt) => {
                    const isSelected = companySize === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => required("companySize", setCompanySize)(opt)}
                        className={`h-[42px] px-4 rounded-xl text-sm font-medium transition cursor-pointer border ${
                          isSelected
                            ? "border-foreground bg-surface-readonly dark:bg-muted text-foreground font-semibold"
                            : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.companySize && <FormFieldMessage error>{fieldErrors.companySize}</FormFieldMessage>}
              </div>
            </SectionCard>

            <SectionCard description="Street, city and country are required." title="Headquarters address">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <FormField error={fieldErrors.street} htmlFor="street" label="Street" required>
                  <Input aria-invalid={Boolean(fieldErrors.street)} id="street" onChange={(e) => required("street", setStreet)(e.target.value)} placeholder="Number, street, ward" value={street} />
                </FormField>
                <FormField htmlFor="district" label="District">
                  <Input id="district" onChange={(e) => setDistrict(e.target.value)} placeholder="Optional" value={district} />
                </FormField>
                <FormField error={fieldErrors.city} htmlFor="city-select" label="City" required>
                  <OptionSelect id="city-select" onChange={required("city", setCity)} options={CITY_OPTIONS} placeholder="Select city..." value={city} />
                </FormField>
                <FormField htmlFor="state-province" label="State / province">
                  <Input id="state-province" onChange={(e) => setStateProvince(e.target.value)} placeholder="Optional" value={stateProvince} />
                </FormField>
                <FormField htmlFor="country-select" label="Country" required>
                  <OptionSelect id="country-select" onChange={setCountry} options={COUNTRY_OPTIONS} placeholder="Select country..." value={country} />
                </FormField>
                <FormField htmlFor="postal-code" label="Postal code">
                  <Input id="postal-code" onChange={(e) => setPostalCode(e.target.value)} placeholder="Optional" value={postalCode} />
                </FormField>
              </div>

              {branches.length > 0 && (
                <div className="flex flex-col gap-2">
                  {branches.map((branch, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-background dark:bg-muted/30">
                      <div className="flex-1 text-sm text-foreground">
                        {branch.street}, {branch.city}, {branch.country}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(idx)}
                        className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        aria-label={`Remove branch ${idx + 1}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isAddingBranch ? (
                <div className="p-4 rounded-xl border border-border bg-background dark:bg-muted/20 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input aria-label="Branch street" className="h-[42px]" onChange={(e) => setBranchStreet(e.target.value)} placeholder="Street address" value={branchStreet} />
                    <Input aria-label="Branch city" className="h-[42px]" onChange={(e) => setBranchCity(e.target.value)} placeholder="City" value={branchCity} />
                    <Input aria-label="Branch country" className="h-[42px]" onChange={(e) => setBranchCountry(e.target.value)} placeholder="Country" value={branchCountry} />
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!branchStreet.trim()} onClick={handleAddBranch} size="lg" type="button">Add</Button>
                    <Button onClick={() => { setIsAddingBranch(false); setBranchStreet(""); }} size="lg" type="button" variant="outline">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button className={DIALOG_BUTTON_CLASS} onClick={() => setIsAddingBranch(true)} type="button" variant="outline">
                    <Plus className="size-4" />
                    <span>Add branch</span>
                  </Button>
                </div>
              )}
            </SectionCard>

            <SectionCard description="Optional. Shown on the public company page. Can be completed later." title="Public profile">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <ImageDrop icon={Upload} inputRef={logoInputRef} label="Logo" onClear={() => setLogoUrl("")} onFile={(file) => readImage(file, "Logo", setLogoUrl)} previewClassName="object-contain p-2" title="Upload logo" url={logoUrl} />
                <ImageDrop icon={ImageIcon} inputRef={coverInputRef} label="Cover image" onClear={() => setCoverUrl("")} onFile={(file) => readImage(file, "Cover", setCoverUrl)} previewClassName="object-cover" title="Upload cover" url={coverUrl} />
              </div>

              <FormField hint="Up to 160 characters" htmlFor="short-desc" label="Short description">
                <Input id="short-desc" onChange={(e) => setShortDescription(e.target.value)} placeholder="One line for company cards" value={shortDescription} />
              </FormField>

              <FormField hint="Up to 5,000 characters" htmlFor="full-desc" label="Description">
                <Textarea id="full-desc" onChange={(e) => setDescription(e.target.value)} placeholder="About the company" rows={4} value={description} />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <FormField htmlFor="culture-summary" label="Culture summary">
                  <Textarea id="culture-summary" onChange={(e) => setCulture(e.target.value)} placeholder="Small squads, weekly demos and a written-first culture." rows={2} value={culture} />
                </FormField>
                <FormField htmlFor="working-days" label="Working days">
                  <Input id="working-days" onChange={(e) => setWorkingDays(e.target.value)} placeholder="e.g. Mon – Fri" value={workingDays} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <TagInput label="Benefits" onChange={setBenefits} placeholder="Add a perk (e.g. 13th-month salary)..." tags={benefits} />
                <TagInput label="Tech stack" onChange={setTechStack} placeholder="Add a technology (e.g. React, Go, Kotlin)..." tags={techStack} />
              </div>
            </SectionCard>

            {!isEditMode && (
              <section
                onClick={() => setVettingConfirmed(!vettingConfirmed)}
                className="p-5 px-6 rounded-2xl bg-(--status-peach-bg) border border-(--primary-border) flex gap-3.5 items-start cursor-pointer transition select-none"
              >
                <span
                  role="checkbox"
                  aria-checked={vettingConfirmed}
                  className={`size-5 rounded-md border-2 border-(--fg-link) flex items-center justify-center shrink-0 mt-0.5 transition ${
                    vettingConfirmed ? "bg-(--fg-link) text-white" : "bg-card"
                  }`}
                >
                  {vettingConfirmed && <Check className="size-3.5 stroke-[3]" />}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    I confirm the legal and tax vetting was completed offline <span className="text-destructive">*</span>
                  </span>
                  <span className="text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground">
                    The enterprise is created as <strong>Active</strong> and becomes visible on the public company list right away.
                  </span>
                  {fieldErrors.vetting && <FormFieldMessage error>{fieldErrors.vetting}</FormFieldMessage>}
                </div>
              </section>
            )}

            <div className="flex items-center justify-end gap-3 pt-4.5">
              <Button
                disabled={isSubmitting}
                onClick={() => navigate(isEditMode ? `/admin/enterprises/${enterpriseId}` : "/admin/enterprises")}
                size="xl"
                type="button"
                variant="outline"
              >
                {t("adminEnterprises.form.cancel", "Cancel")}
              </Button>
              <Button disabled={isSubmitting} size="xl" type="submit">
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? t("adminEnterprises.form.save", "Save changes")
                    : t("adminEnterprises.form.create", "Create enterprise")}
              </Button>
            </div>
          </div>

          <aside className="sticky top-6 flex flex-col gap-4">
            {!isEditMode ? (
              <section className="p-5 surface-card flex flex-col gap-2">
                <span className="eyebrow">Set by the system</span>
                <p className="text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground m-0">
                  Status <strong>Active</strong>, creator (you), created time and enterprise ID. Status is never chosen in this form.
                  <br /><br />
                  An invitation (valid 7 days) is emailed to the company admin when you create the enterprise.
                </p>
              </section>
            ) : (
              <>
                <section className="p-5 surface-card flex flex-col gap-3">
                  <span className="eyebrow">Not editable here</span>
                  <p className="text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground m-0">
                    <strong className="text-foreground">Tax code</strong> is locked after creation.
                    <br />
                    <strong className="text-foreground">Status</strong> changes with Suspend or Activate on the detail page.
                    <br />
                    <strong className="text-foreground">Creator</strong> and deletion data are set by the system.
                  </p>
                </section>

                <section className="p-5 surface-card flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted-foreground">Current status</span>
                  <EnterpriseStatusBadge status={initialData?.status} />
                </section>
              </>
            )}
          </aside>
        </div>
      </form>
    </div>
  );
}


function OptionSelect({ id, onChange, options, placeholder, value }: { id: string; onChange: (value: string) => void; options: readonly string[]; placeholder: string; value: string }) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="w-full h-[46px] rounded-md" id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ImageDropProps = {
  icon: LucideIcon;
  inputRef: RefObject<HTMLInputElement | null>;
  label: string;
  onClear: () => void;
  onFile: (file: File) => void;
  previewClassName: string;
  title: string;
  url: string;
};

/** Click-to-upload image box with a preview and a clear button (logo and cover). */
function ImageDrop({ icon: Icon, inputRef, label, onClear, onFile, previewClassName, title, url }: ImageDropProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        className="h-[120px] rounded-xl border-[1.5px] border-dashed border-border bg-background dark:bg-muted/30 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:border-brand/60 transition overflow-hidden relative"
      >
        {url ? (
          <>
            <img src={url} alt={`${label} preview`} className={`h-full w-full ${previewClassName}`} />
            <button
              type="button"
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-1.5 right-1.5 size-6 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <>
            <Icon className="size-5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{title}</span>
            <span>PNG or JPG, up to 2 MB</span>
          </>
        )}
      </div>
    </div>
  );
}
