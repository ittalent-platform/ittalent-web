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
} from "../enterprise-registration.types";
import { useSaveRegistrationDraftMutation } from "../enterprise-registration.queries";

interface RegistrationWizardContextType {
  registrationId: string | null;
  currentStep: WizardStepKey;
  draft: EnterpriseRegistrationDetail | null;
  isSaving: boolean;
  setRegistrationId: (id: string | null) => void;
  setCurrentStep: (step: WizardStepKey) => void;
  setDraft: (draft: EnterpriseRegistrationDetail | null) => void;
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
        isSaving: saveMutation.isPending,
        setRegistrationId,
        setCurrentStep,
        setDraft,
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
