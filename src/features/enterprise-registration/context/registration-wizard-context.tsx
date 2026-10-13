import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type {
  EnterpriseRegistrationDetail,
  SaveEnterpriseRegistrationDraftRequest,
  WizardStepKey,
} from "@/features/enterprise-registration/enterprise-registration.types";
import { useSaveRegistrationDraftMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

interface RegistrationWizardContextType {
  registrationId: string | null;
  currentStep: WizardStepKey;
  draft: EnterpriseRegistrationDetail | null;
  isLegalRepresentative: boolean;
  isSaving: boolean;
  setRegistrationId: (id: string | null) => void;
  setCurrentStep: (step: WizardStepKey) => void;
  setDraft: (draft: EnterpriseRegistrationDetail | null) => void;
  setIsLegalRepresentative: (isLegal: boolean) => void;
  saveDraft: (data: SaveEnterpriseRegistrationDraftRequest) => Promise<void>;
}

const RegistrationWizardContext =
  createContext<RegistrationWizardContextType | null>(null);

export function RegistrationWizardProvider({
  children,
  initialRegistrationId = null,
  initialStep = "step1",
  initialDraft = null,
}: {
  children: ReactNode;
  initialRegistrationId?: string | null;
  initialStep?: WizardStepKey;
  initialDraft?: EnterpriseRegistrationDetail | null;
}) {
  const [registrationId, setRegistrationId] = useState<string | null>(
    initialRegistrationId,
  );
  const [currentStep, setCurrentStep] = useState<WizardStepKey>(initialStep);
  const [draft, setDraft] = useState<EnterpriseRegistrationDetail | null>(
    initialDraft,
  );
  const [isLegalRepresentative, setIsLegalRepresentative] = useState<boolean>(true);

  const saveMutation = useSaveRegistrationDraftMutation();

  const handleSaveDraft = async (data: SaveEnterpriseRegistrationDraftRequest) => {
    if (!registrationId) return;
    const updated = await saveMutation.mutateAsync({
      id: registrationId,
      body: data,
    });
    setDraft(updated);
  };

  return (
    <RegistrationWizardContext.Provider
      value={{
        registrationId,
        currentStep,
        draft,
        isLegalRepresentative,
        isSaving: saveMutation.isPending,
        setRegistrationId,
        setCurrentStep,
        setDraft,
        setIsLegalRepresentative,
        saveDraft: handleSaveDraft,
      }}
    >
      {children}
    </RegistrationWizardContext.Provider>
  );
}

export function useRegistrationWizard() {
  const context = useContext(RegistrationWizardContext);
  if (!context) {
    throw new Error(
      "useRegistrationWizard must be used within a RegistrationWizardProvider",
    );
  }
  return context;
}
