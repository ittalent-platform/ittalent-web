import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  Check,
  ImageIcon,
  Lock,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  CreateEnterpriseDto,
  EnterpriseDetailDto,
  UpdateEnterpriseDto,
} from "@/api/generated/types.gen";
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
  useCreateEnterpriseMutation,
  useEnterpriseDetailQuery,
  useUpdateEnterpriseMutation,
} from "./enterprises.queries";
import { EnterpriseStatusBadge, formatEnterpriseId } from "./enterprise-badges";

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
      <label className="text-[13.5px] font-semibold text-foreground">{label}</label>
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

  function handleLogoFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.showToast({
        tone: "error",
        title: "File too large",
        message: "Logo image must be under 2 MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleCoverFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.showToast({
        tone: "error",
        title: "File too large",
        message: "Cover image must be under 2 MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverUrl(reader.result as string);
    };
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
      const errObj = err as {
        status?: number;
        data?: { message?: string; errors?: Record<string, string[]> };
        message?: string;
      };

      if (errObj.status === 409) {
        setErrorMessage(
          errObj.data?.message ||
            "Tax code or corporate email already belongs to another enterprise. Please verify details."
        );
      } else {
        setErrorMessage(
          errObj.data?.message ||
            errObj.message ||
            "An error occurred while saving the enterprise profile."
        );
      }
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Breadcrumb matching design */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/admin/enterprises" className="hover:text-foreground transition-colors">
          {t("adminEnterprises.page.title", "Enterprise Profiles")}
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">/</span>
        <span className="font-mono text-foreground font-semibold">
          {isEditMode ? `${formatEnterpriseId(enterpriseId)} / Edit` : "New"}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {isEditMode
            ? t("adminEnterprises.form.editTitle", "Edit enterprise profile")
            : t("adminEnterprises.form.createTitle", "Create enterprise profile")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Changes are saved to the audit log. Fields marked * are required."
            : "For a company that passed offline legal and tax vetting. Fields marked * are required."}
        </p>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-(--danger-border) bg-(--danger-bg) text-(--danger-fg) text-sm">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Please resolve the highlighted validation errors before proceeding.</p>
            <p className="text-xs mt-1 text-(--danger-fg)/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form & Right Rail Grid Layout matching design */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          {/* Main Form Sections */}
          <div className="flex flex-col gap-[18px]">
            {/* Section 1: Legal identity */}
            <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-foreground">Legal identity</h2>
                <span className="text-[13px] text-muted-foreground">Must match the documents checked during offline vetting.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="company-name" className="text-[13.5px] font-semibold text-foreground">
                    Display name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="company-name"
                    placeholder="Nova Fintech"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={`h-[46px] rounded-xl border-border ${fieldErrors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  <span className="text-[12.5px] text-muted-foreground">Shown on the public company page · 2–150 characters</span>
                  {fieldErrors.name && <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="legal-name" className="text-[13.5px] font-semibold text-foreground">
                    Legal name
                  </label>
                  <Input
                    id="legal-name"
                    placeholder="Công ty Cổ phần …"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                  <span className="text-[12.5px] text-muted-foreground">As on the business registration</span>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="tax-code" className="text-[13.5px] font-semibold text-foreground">
                    Tax code <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="tax-code"
                      placeholder="10–13 numeric digits"
                      value={taxCode}
                      disabled={isEditMode}
                      onChange={(e) => {
                        setTaxCode(e.target.value);
                        if (fieldErrors.taxCode) setFieldErrors((prev) => ({ ...prev, taxCode: "" }));
                      }}
                      className={`h-[46px] rounded-xl border-border font-mono ${
                        isEditMode ? "bg-surface-readonly dark:bg-muted/40 text-foreground/70 cursor-not-allowed pr-10" : ""
                      } ${fieldErrors.taxCode ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    />
                    {isEditMode && (
                      <span className="absolute right-3.5 top-3.5 text-muted-foreground">
                        <Lock className="size-4" />
                      </span>
                    )}
                  </div>
                  <span className="text-[12.5px] text-muted-foreground">
                    {isEditMode ? "Locked after creation · 10–13 digits" : "10–13 digits · must be unique"}
                  </span>
                  {fieldErrors.taxCode && <p className="text-xs text-destructive font-medium">{fieldErrors.taxCode}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="reg-number" className="text-[13.5px] font-semibold text-foreground">
                    Registration number
                  </label>
                  <Input
                    id="reg-number"
                    placeholder="Optional"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="h-[46px] rounded-xl border-border font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="founded-year" className="text-[13.5px] font-semibold text-foreground">
                    Founded year
                  </label>
                  <Input
                    id="founded-year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder="e.g. 2016"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value ? parseInt(e.target.value, 10) : "")}
                    className="h-[46px] rounded-xl border-border font-mono"
                  />
                  <span className="text-[12.5px] text-muted-foreground">Between 1900 and this year</span>
                </div>
              </div>
            </section>

            {/* Section 2: Contact */}
            <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-foreground">Contact</h2>
                <span className="text-[13px] text-muted-foreground">The corporate email and tax code must not belong to another enterprise.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="email" className="text-[13.5px] font-semibold text-foreground">
                    Corporate email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hr@company.vn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`h-[46px] rounded-xl border-border ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  <span className="text-[12.5px] text-muted-foreground">Must be unique · stored in lowercase</span>
                  {fieldErrors.email && <p className="text-xs text-destructive font-medium">{fieldErrors.email}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="phone" className="text-[13.5px] font-semibold text-foreground">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="phone"
                    placeholder="028 3822 1100"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className={`h-[46px] rounded-xl border-border ${fieldErrors.phone ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  <span className="text-[12.5px] text-muted-foreground">8–20 digits</span>
                  {fieldErrors.phone && <p className="text-xs text-destructive font-medium">{fieldErrors.phone}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="website" className="text-[13.5px] font-semibold text-foreground">
                    Website
                  </label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Company admin (Create mode only) */}
            {!isEditMode && (
              <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-bold text-foreground">Company admin</h2>
                  <span className="text-[13px] text-muted-foreground">The first person who can sign in for this company. They get an invitation email to set a password.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                  <div className="flex flex-col gap-2 min-w-0">
                    <label htmlFor="admin-name" className="text-[13.5px] font-semibold text-foreground">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="admin-name"
                      placeholder="Tran Thi B"
                      value={companyAdminName}
                      onChange={(e) => {
                        setCompanyAdminName(e.target.value);
                        if (fieldErrors.adminName) setFieldErrors((prev) => ({ ...prev, adminName: "" }));
                      }}
                      className={`h-[46px] rounded-xl border-border ${fieldErrors.adminName ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    />
                    {fieldErrors.adminName && <p className="text-xs text-destructive font-medium">{fieldErrors.adminName}</p>}
                  </div>

                  <div className="flex flex-col gap-2 min-w-0">
                    <label htmlFor="admin-email" className="text-[13.5px] font-semibold text-foreground">
                      Work email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="name@company.vn"
                      value={companyAdminEmail}
                      onChange={(e) => {
                        setCompanyAdminEmail(e.target.value);
                        if (fieldErrors.adminEmail) setFieldErrors((prev) => ({ ...prev, adminEmail: "" }));
                      }}
                      className={`h-[46px] rounded-xl border-border ${fieldErrors.adminEmail ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    />
                    <span className="text-[12.5px] text-muted-foreground">Must not belong to another ITTalent account</span>
                    {fieldErrors.adminEmail && <p className="text-xs text-destructive font-medium">{fieldErrors.adminEmail}</p>}
                  </div>

                  <div className="flex flex-col gap-2 min-w-0">
                    <label htmlFor="admin-title" className="text-[13.5px] font-semibold text-foreground">
                      Job title
                    </label>
                    <Input
                      id="admin-title"
                      placeholder="Optional"
                      value={companyAdminTitle}
                      onChange={(e) => setCompanyAdminTitle(e.target.value)}
                      className="h-[46px] rounded-xl border-border"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: Business */}
            <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-foreground">Business</h2>
                <span className="text-[13px] text-muted-foreground">Used for filters on the public company list.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="industry-select" className="text-[13.5px] font-semibold text-foreground">
                    Industry <span className="text-destructive">*</span>
                  </label>
                  <Select value={industry} onValueChange={(val) => {
                    setIndustry(val);
                    if (fieldErrors.industry) setFieldErrors((prev) => ({ ...prev, industry: "" }));
                  }}>
                    <SelectTrigger id="industry-select" className="w-full h-[46px] rounded-xl border-border">
                      <SelectValue placeholder="Select industry..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[12.5px] text-muted-foreground">e.g. Information Technology, Fintech</span>
                  {fieldErrors.industry && <p className="text-xs text-destructive font-medium">{fieldErrors.industry}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="company-type-select" className="text-[13.5px] font-semibold text-foreground">
                    Company type
                  </label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger id="company-type-select" className="w-full h-[46px] rounded-xl border-border">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[12.5px] text-muted-foreground">Product, Outsourcing, IT Service, Consulting, Agency, Hybrid or Other</span>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <TagInput
                    label="Sub-industries"
                    placeholder="Type and press Enter"
                    tags={subIndustries}
                    onChange={setSubIndustries}
                  />
                </div>
              </div>

              {/* Company size button chips matching design */}
              <div className="flex flex-col gap-2">
                <label className="text-[13.5px] font-semibold text-foreground">
                  Company size <span className="text-destructive">*</span>
                </label>
                <div role="group" className="flex flex-wrap gap-2">
                  {COMPANY_SIZE_OPTIONS.map((opt) => {
                    const isSelected = companySize === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setCompanySize(opt);
                          if (fieldErrors.companySize) setFieldErrors((prev) => ({ ...prev, companySize: "" }));
                        }}
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
                {fieldErrors.companySize && <p className="text-xs text-destructive font-medium">{fieldErrors.companySize}</p>}
              </div>
            </section>

            {/* Section 5: Headquarters address */}
            <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-foreground">Headquarters address</h2>
                <span className="text-[13px] text-muted-foreground">Street, city and country are required.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="street" className="text-[13.5px] font-semibold text-foreground">
                    Street <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="street"
                    placeholder="Number, street, ward"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      if (fieldErrors.street) setFieldErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    className={`h-[46px] rounded-xl border-border ${fieldErrors.street ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  {fieldErrors.street && <p className="text-xs text-destructive font-medium">{fieldErrors.street}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="district" className="text-[13.5px] font-semibold text-foreground">
                    District
                  </label>
                  <Input
                    id="district"
                    placeholder="Optional"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="city-select" className="text-[13.5px] font-semibold text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Select value={city} onValueChange={(val) => {
                    setCity(val);
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                  }}>
                    <SelectTrigger id="city-select" className="w-full h-[46px] rounded-xl border-border">
                      <SelectValue placeholder="Select city..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.city && <p className="text-xs text-destructive font-medium">{fieldErrors.city}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="state-province" className="text-[13.5px] font-semibold text-foreground">
                    State / province
                  </label>
                  <Input
                    id="state-province"
                    placeholder="Optional"
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="country-select" className="text-[13.5px] font-semibold text-foreground">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country-select" className="w-full h-[46px] rounded-xl border-border">
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="postal-code" className="text-[13.5px] font-semibold text-foreground">
                    Postal code
                  </label>
                  <Input
                    id="postal-code"
                    placeholder="Optional"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                </div>
              </div>

              {/* Branch list */}
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

              {/* Add branch form */}
              {isAddingBranch ? (
                <div className="p-4 rounded-xl border border-border bg-background dark:bg-muted/20 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Street address"
                      value={branchStreet}
                      onChange={(e) => setBranchStreet(e.target.value)}
                      className="h-[42px] rounded-xl border-border"
                    />
                    <Input
                      placeholder="City"
                      value={branchCity}
                      onChange={(e) => setBranchCity(e.target.value)}
                      className="h-[42px] rounded-xl border-border"
                    />
                    <Input
                      placeholder="Country"
                      value={branchCountry}
                      onChange={(e) => setBranchCountry(e.target.value)}
                      className="h-[42px] rounded-xl border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddBranch}
                      disabled={!branchStreet.trim()}
                      className="h-9 px-4 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setIsAddingBranch(false); setBranchStreet(""); }}
                      className="h-9 px-4 rounded-xl border-border text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingBranch(true)}
                    className="h-10 px-4 rounded-xl border-border text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Add branch</span>
                  </Button>
                </div>
              )}
            </section>

            {/* Section 6: Public profile */}
            <section className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-foreground">Public profile</h2>
                <span className="text-[13px] text-muted-foreground">Optional. Shown on the public company page. Can be completed later.</span>
              </div>

              {/* Logo & Cover Dropzones matching design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <div className="flex flex-col gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">Logo</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFile(file);
                    }}
                  />
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="h-[120px] rounded-xl border-[1.5px] border-dashed border-border bg-background dark:bg-muted/30 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:border-brand/60 transition overflow-hidden relative"
                  >
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain p-2" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLogoUrl(""); }}
                          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Upload logo</span>
                        <span>PNG or JPG, up to 2 MB</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">Cover image</span>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverFile(file);
                    }}
                  />
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="h-[120px] rounded-xl border-[1.5px] border-dashed border-border bg-background dark:bg-muted/30 flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:border-brand/60 transition overflow-hidden relative"
                  >
                    {coverUrl ? (
                      <>
                        <img src={coverUrl} alt="Cover preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCoverUrl(""); }}
                          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="size-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">Upload cover</span>
                        <span>PNG or JPG, up to 2 MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="short-desc" className="text-[13.5px] font-semibold text-foreground">
                  Short description
                </label>
                <Input
                  id="short-desc"
                  placeholder="One line for company cards"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="h-[46px] rounded-xl border-border"
                />
                <span className="text-[12.5px] text-muted-foreground">Up to 160 characters</span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="full-desc" className="text-[13.5px] font-semibold text-foreground">
                  Description
                </label>
                <Textarea
                  id="full-desc"
                  rows={4}
                  placeholder="About the company"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-border p-3 text-sm focus-visible:ring-primary/20"
                />
                <span className="text-[12.5px] text-muted-foreground">Up to 5,000 characters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="culture-summary" className="text-[13.5px] font-semibold text-foreground">
                    Culture summary
                  </label>
                  <Textarea
                    id="culture-summary"
                    rows={2}
                    placeholder="Small squads, weekly demos and a written-first culture."
                    value={culture}
                    onChange={(e) => setCulture(e.target.value)}
                    className="rounded-xl border-border p-3 text-sm focus-visible:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="working-days" className="text-[13.5px] font-semibold text-foreground">
                    Working days
                  </label>
                  <Input
                    id="working-days"
                    placeholder="e.g. Mon – Fri"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(e.target.value)}
                    className="h-[46px] rounded-xl border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <TagInput
                  label="Benefits"
                  placeholder="Add a perk (e.g. 13th-month salary)..."
                  tags={benefits}
                  onChange={setBenefits}
                />
                <TagInput
                  label="Tech stack"
                  placeholder="Add a technology (e.g. React, Go, Kotlin)..."
                  tags={techStack}
                  onChange={setTechStack}
                />
              </div>
            </section>

            {/* Section 7: Offline Vetting Confirmation (Create mode only) */}
            {!isEditMode && (
              <section
                onClick={() => setVettingConfirmed(!vettingConfirmed)}
                className="p-5 px-6 rounded-2xl bg-(--status-peach-bg) dark:bg-amber-950/20 border border-(--primary-border) dark:border-amber-900/40 flex gap-3.5 items-start cursor-pointer transition select-none"
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
                  {fieldErrors.vetting && (
                    <p className="text-xs text-destructive font-medium mt-1">{fieldErrors.vetting}</p>
                  )}
                </div>
              </section>
            )}

            {/* Footer Actions matching design */}
            <div className="flex items-center justify-end gap-3 pt-4.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEditMode ? `/admin/enterprises/${enterpriseId}` : "/admin/enterprises")}
                disabled={isSubmitting}
                className="h-11 px-5 rounded-xl border-border bg-card text-foreground font-semibold text-sm hover:bg-muted"
              >
                {t("adminEnterprises.form.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-5 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold text-sm transition shadow-none cursor-pointer"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? t("adminEnterprises.form.save", "Save changes")
                    : t("adminEnterprises.form.create", "Create enterprise")}
              </Button>
            </div>
          </div>

          {/* Right Sticky Sidebar (300px) matching design */}
          <aside className="sticky top-6 flex flex-col gap-4">
            {!isEditMode ? (
              <>
                <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3">
                  <span className="text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle uppercase">
                    REQUIRED TO CREATE
                  </span>
                  <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                    {[
                      "Display name",
                      "Tax code",
                      "Corporate email",
                      "Phone",
                      "Company admin name + work email",
                      "Industry",
                      "Company size",
                      "Street, city, country",
                      "Offline vetting",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13.5px] text-foreground">
                        <span className="size-1.5 rounded-full bg-brand shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-2">
                  <span className="text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle uppercase">
                    SET BY THE SYSTEM
                  </span>
                  <p className="text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground m-0">
                    Status <strong>Active</strong>, creator (you), created time and enterprise ID. Status is never chosen in this form.
                    <br /><br />
                    An invitation (valid 7 days) is emailed to the company admin when you create the enterprise.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3">
                  <span className="text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle uppercase">
                    NOT EDITABLE HERE
                  </span>
                  <p className="text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground m-0">
                    <strong className="text-foreground">Tax code</strong> is locked after creation.
                    <br />
                    <strong className="text-foreground">Status</strong> changes with Suspend or Activate on the detail page.
                    <br />
                    <strong className="text-foreground">Creator</strong> and deletion data are set by the system.
                  </p>
                </section>

                <section className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-3">
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
