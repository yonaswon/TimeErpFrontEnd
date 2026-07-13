import { CuttingFile } from '@/types/cutting';
import { CuttingFileWizardOverlay } from './CuttingFileWizardOverlay';

interface EditCuttingFileOverlayProps {
  file: CuttingFile;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCuttingFileOverlay = ({ file, onClose, onSuccess }: EditCuttingFileOverlayProps) => (
  <CuttingFileWizardOverlay mode="edit" initialFile={file} onClose={onClose} onSuccess={onSuccess} />
);
