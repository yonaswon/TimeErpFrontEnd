import { CuttingFileWizardOverlay } from './CuttingFileWizardOverlay';

interface CreateCuttingFileOverlayProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCuttingFileOverlay = ({ onClose, onSuccess }: CreateCuttingFileOverlayProps) => (
  <CuttingFileWizardOverlay mode="create" onClose={onClose} onSuccess={onSuccess} />
);
