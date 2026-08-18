import { CuttingFileWizardOverlay } from './CuttingFileWizardOverlay';
import { NestingApplyPrefill } from '@/types/cutting';

interface CreateCuttingFileOverlayProps {
  onClose: () => void;
  onSuccess: () => void;
  nestPrefill?: NestingApplyPrefill | null;
}

export const CreateCuttingFileOverlay = ({ onClose, onSuccess, nestPrefill }: CreateCuttingFileOverlayProps) => (
  <CuttingFileWizardOverlay mode="create" onClose={onClose} onSuccess={onSuccess} nestPrefill={nestPrefill} />
);
