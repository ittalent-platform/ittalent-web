import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  Plus,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  CreateEnterpriseDto,
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
import { Breadcrumb } from "@/components/common/breadcrumb";
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
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-input bg-card min-h-12 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground border border-border"
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
        <div className="flex items-center gap-1 flex-1 min-w-[140px]">
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { enterpriseId } = useParams<{ enterpriseId?: string }>();
  const isEditMode = Boolean(enterpriseId);
  const detailQuery = useEnterpriseDetailQuery(isEditMode ? enterpriseId : undefined);

  const createMutation = useCreateEnterpriseMutation();
  const updateMutation = useUpdateEnterpriseMutation(enterpriseId || "");

  // Form states - Empty placeholders on Create as requested
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);

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
      setIndustry(data.industry || "");
      setCompanyType(data.companyType || "");
      setCompanySize(data.companySize || "");
      if (data.address) {
        setStreet(data.address.street || "");
        setDistrict(data.address.district || "");
        setCity(data.address.city || "");
        setCountry(data.address.country || "");
        const addr = data.address as { postal_code?: string; postalCode?: string };
        setPostalCode(addr.postal_code || addr.postalCode || "");
      }
      setShortDescription(data.shortDescription || "");
      setDescription(data.description || "");
      setBenefits(data.benefits || []);
      setTechStack(data.techStack || []);
    }
  }, [isEditMode, detailQuery.data]);

  // Validation
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Company name must be at least 2 characters";
    }

    if (!isEditMode) {
      if (!taxCode.trim() || !/^\d{10,13}$/.test(taxCode.trim())) {
        errors.taxCode = "Tax code must be 10 to 13 numeric digits";
      }
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Valid corporate email is required";
    }

    if (!phone.trim()) {
      errors.phone = "Corporate phone is required";
    }

    if (!street.trim()) {
      errors.street = "Street address is required";
    }

    if (!isEditMode && !confirmedVetting) {
      errors.confirmedVetting = "You must confirm offline legal and tax vetting before creating";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage("Please resolve the highlighted validation errors before proceeding.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const payload: UpdateEnterpriseDto = {
          name: name.trim(),
          legal_name: legalName.trim() || undefined,
          registration_number: registrationNumber.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          industry: industry.trim() || undefined,
          company_size: (companySize as UpdateEnterpriseDto["company_size"]) || undefined,
          company_type: (companyType.trim() as UpdateEnterpriseDto["company_type"]) || undefined,
          founded_year: typeof foundedYear === "number" ? foundedYear : undefined,
          address: {
            street: street.trim(),
            district: district.trim() || undefined,
            city: city.trim() || "Ho Chi Minh",
            country: country.trim() || "Vietnam",
            postal_code: postalCode.trim() || undefined,
          },
          short_description: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          tech_stack: techStack.length > 0 ? techStack : undefined,
        };

        await updateMutation.mutateAsync(payload);
        toast.showToast({
          tone: "success",
          title: "Profile updated",
          message: `${name} details were saved successfully.`,
        });
        navigate(`/admin/enterprises/${enterpriseId}`);
      } else {
        const payload: CreateEnterpriseDto = {
          name: name.trim(),
          legal_name: legalName.trim() || undefined,
          tax_code: taxCode.trim(),
          registration_number: registrationNumber.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          industry: industry.trim() || "Software & IT Services",
          company_size: (companySize as CreateEnterpriseDto["company_size"]) || "51-200",
          company_type: (companyType.trim() as CreateEnterpriseDto["company_type"]) || "Product",
          founded_year: typeof foundedYear === "number" ? foundedYear : undefined,
          address: {
            street: street.trim(),
            district: district.trim() || undefined,
            city: city.trim() || "Ho Chi Minh",
            country: country.trim() || "Vietnam",
            postal_code: postalCode.trim() || undefined,
          },
          short_description: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          benefits: benefits.length > 0 ? benefits : undefined,
          tech_stack: techStack.length > 0 ? techStack : undefined,
        };

        const created = await createMutation.mutateAsync(payload);
        toast.showToast({
          tone: "success",
          title: "Enterprise created",
          message: `${name} was successfully registered.`,
        });
        navigate(created?.id ? `/admin/enterprises/${created.id}` : "/admin/enterprises");
      }
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string } | null;
      setErrorMessage(
        errObj?.data?.message ||
          errObj?.message ||
          (err instanceof Error ? err.message : "Failed to save enterprise profile"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEditMode && detailQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        ariaLabel={t("adminEnterprises.page.title", "Enterprise Profiles")}
        items={[
          { label: t("adminEnterprises.page.title", "Enterprise Profiles"), to: "/admin/enterprises" },
          {
            label: isEditMode
              ? t("adminEnterprises.form.editTitle", "Edit enterprise profile")
              : t("adminEnterprises.form.createTitle", "Create enterprise profile"),
          },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground">
            {isEditMode
              ? t("adminEnterprises.form.editTitle", "Edit enterprise profile")
              : t("adminEnterprises.form.createTitle", "Create enterprise profile")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? t("adminEnterprises.form.editSubtitle", "Update company profile and recruitment details")
              : t("adminEnterprises.form.createSubtitle", "Register a new verified enterprise to post tech jobs on ITTalent")}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="h-9 px-3 gap-1.5 border-border">
          <Link to="/admin/enterprises">
            <ArrowLeft className="size-4" />
            <span>{t("actions.cancel", "Cancel")}</span>
          </Link>
        </Button>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-(--danger-border) bg-(--danger-bg) text-(--danger-fg) text-sm animate-in fade-in">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">
              Please resolve the highlighted validation errors before proceeding.
            </p>
            <p className="text-xs mt-1 text-(--danger-fg)/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {t("adminEnterprises.form.basicInfo", "Basic Information")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="company-name" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.nameLabel", "Company Name")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="company-name"
                placeholder={t("adminEnterprises.form.placeholders.name", "e.g. Nova Fintech, CloudBridge Solutions")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive font-medium">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="legal-name" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.legalNameLabel", "Legal Entity Name")}
              </label>
              <Input
                id="legal-name"
                placeholder={t("adminEnterprises.form.placeholders.legalName", "e.g. CÔNG TY CỔ PHẦN CÔNG NGHỆ NOVA FINTECH")}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="industry-select" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.industryLabel", "Industry")}
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger id="industry-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t("adminEnterprises.form.selectIndustry", "Select industry...")} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company-type-select" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.typeLabel", "Company Type")}
              </label>
              <Select value={companyType} onValueChange={setCompanyType}>
                <SelectTrigger id="company-type-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t("adminEnterprises.form.selectType", "Select company type...")} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company-size-select" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.sizeLabel", "Company Size")}
              </label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger id="company-size-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t("adminEnterprises.form.selectSize", "Select company size...")} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="founded-year" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.foundedYearLabel", "Founded Year")}
              </label>
              <Input
                id="founded-year"
                type="number"
                min={1950}
                max={2030}
                placeholder={t("adminEnterprises.form.placeholders.foundedYear", "e.g. 2018")}
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value ? parseInt(e.target.value, 10) : "")}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Legal & Tax Identity */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {t("adminEnterprises.form.legalTax", "Legal & Tax Identity")}
            </h2>
            {isEditMode ? (
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                NOT EDITABLE HERE
              </span>
            ) : (
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                REQUIRED TO CREATE
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="tax-code" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.taxCodeLabel", "Tax Code")} {!isEditMode && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <Input
                  id="tax-code"
                  placeholder={t("adminEnterprises.form.placeholders.taxCode", "10–13 numeric digits")}
                  value={taxCode}
                  disabled={isEditMode}
                  onChange={(e) => {
                    setTaxCode(e.target.value);
                    if (fieldErrors.taxCode) setFieldErrors((prev) => ({ ...prev, taxCode: "" }));
                  }}
                  className={`font-mono ${isEditMode ? "bg-muted cursor-not-allowed" : ""} ${
                    fieldErrors.taxCode ? "border-destructive focus-visible:ring-destructive/20" : ""
                  }`}
                />
                {isEditMode && (
                  <Lock className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isEditMode ? t("adminEnterprises.form.taxCodeLocked", "Locked after creation · 10–13 digits") : t("adminEnterprises.form.placeholders.taxCodeFormat", "10–13 numeric digits (e.g. 0312345678)")}
              </p>
              {fieldErrors.taxCode && (
                <p className="text-xs text-destructive font-medium">{fieldErrors.taxCode}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-number" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.regNumberLabel", "Registration Number")}
              </label>
              <Input
                id="reg-number"
                placeholder={t("adminEnterprises.form.placeholders.regNumber", "e.g. 0312345678-001")}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
          </div>

          {!isEditMode && (
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/40 cursor-pointer hover:bg-muted/60 transition">
                <input
                  type="checkbox"
                  checked={confirmedVetting}
                  onChange={(e) => {
                    setConfirmedVetting(e.target.checked);
                    if (fieldErrors.confirmedVetting) setFieldErrors((prev) => ({ ...prev, confirmedVetting: "" }));
                  }}
                  className="size-4 mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">
                    I confirm the legal and tax vetting was completed offline
                  </p>
                  <p className="text-muted-foreground">
                    Admin verifies physical license, tax office standing, and primary representative credentials before creating profile.
                  </p>
                </div>
              </label>
              {fieldErrors.confirmedVetting && (
                <p className="text-xs text-destructive font-medium mt-1.5">{fieldErrors.confirmedVetting}</p>
              )}
            </div>
          )}
        </section>

        {/* Section 3: Contact & Location */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {t("adminEnterprises.form.contactLocation", "Contact & Location")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.emailLabel", "Corporate Email")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t("adminEnterprises.form.placeholders.email", "contact@company.com")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.phoneLabel", "Phone Number")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="phone"
                placeholder={t("adminEnterprises.form.placeholders.phone", "e.g. +84 28 3822 1100")}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={fieldErrors.phone ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive font-medium">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.websiteLabel", "Website URL")}
              </label>
              <Input
                id="website"
                type="url"
                placeholder={t("adminEnterprises.form.placeholders.website", "https://company.com")}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="street" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.streetLabel", "Street Address")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="street"
                placeholder={t("adminEnterprises.form.placeholders.street", "e.g. 12 Ton Dan, Ward 13")}
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  if (fieldErrors.street) setFieldErrors((prev) => ({ ...prev, street: "" }));
                }}
                className={fieldErrors.street ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {fieldErrors.street && (
                <p className="text-xs text-destructive font-medium">{fieldErrors.street}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="district" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.districtLabel", "District")}
              </label>
              <Input
                id="district"
                placeholder={t("adminEnterprises.form.placeholders.district", "e.g. District 4")}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="city-select" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.cityLabel", "City")}
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="city-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t("adminEnterprises.form.selectCity", "Select city...")} />
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="postal-code" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.postalCodeLabel", "Postal Code")}
              </label>
              <Input
                id="postal-code"
                placeholder={t("adminEnterprises.form.placeholders.postalCode", "e.g. 700000")}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="country-select" className="text-sm font-semibold text-foreground">
                {t("adminEnterprises.form.countryLabel", "Country")}
              </label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder={t("adminEnterprises.form.selectCountry", "Select country...")} />
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
          </div>
        </section>

        {/* Section 4: Description & Tagline */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {t("adminEnterprises.detail.overview", "Company Overview")}
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="short-desc" className="text-sm font-semibold text-foreground">
              {t("adminEnterprises.form.shortDescriptionLabel", "Short Tagline")}
            </label>
            <Input
              id="short-desc"
              placeholder={t("adminEnterprises.form.placeholders.shortDescription", "e.g. Leading payment gateway and digital banking platform")}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="full-desc" className="text-sm font-semibold text-foreground">
              {t("adminEnterprises.form.descriptionLabel", "Company Description")}
            </label>
            <Textarea
              id="full-desc"
              rows={4}
              placeholder={t("adminEnterprises.form.placeholders.description", "Tell candidates about company mission, core products, and vision...")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-input p-3 text-sm focus-visible:ring-primary/20"
            />
          </div>
        </section>

        {/* Section 5: Tech Stack & Benefits */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {t("adminEnterprises.form.techBenefits", "Tech Stack & Benefits")}
          </h2>

          <TagInput
            label={t("adminEnterprises.form.techStackLabel", "Tech Stack")}
            placeholder={t("adminEnterprises.form.techStackPlaceholder", "Add a technology (e.g. React, Node.js, Go)...")}
            tags={techStack}
            onChange={setTechStack}
          />

          <TagInput
            label={t("adminEnterprises.form.benefitsLabel", "Benefits & Perks")}
            placeholder={t("adminEnterprises.form.benefitsPlaceholder", "Add a perk (e.g. 13th month salary, Remote work)...")}
            tags={benefits}
            onChange={setBenefits}
          />
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/enterprises")}
            disabled={isSubmitting}
            className="h-10 px-5 rounded-full border-border font-semibold"
          >
            {t("adminEnterprises.form.cancel", "Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 rounded-full font-semibold shadow-sm"
          >
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? t("adminEnterprises.form.save", "Save changes")
                : t("adminEnterprises.form.create", "Create enterprise")}
          </Button>
        </div>
      </form>
    </div>
  );
}
