import { Modification } from './utils/types'
import { getStatusColor } from './utils/statusUtils'
import { Play, Upload, Image as ImageIcon, MessageSquare } from 'lucide-react'
import MessageButton from '@/Components/SalesApp/Home/DetailLead/Message/MessageButton'

interface ModificationItemProps {
  modification: Modification
  isLast: boolean
  onStartModification: (modificationId: number) => void
  onShowSubmitModificationOverlay: (modification: Modification) => void
}

const ModificationItem = ({ 
  modification, 
  isLast, 
  onStartModification, 
  onShowSubmitModificationOverlay 
}: ModificationItemProps) => {
  return (
    <div className="flex gap-3 relative">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1"></div>
        {!isLast && <div className="w-0.5 flex-1 bg-orange-300 dark:bg-orange-700"></div>}
      </div>

      {/* Modification content */}
      <div className="flex-1 bg-orange-50 dark:bg-orange-900/10 p-2 rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col gap-1">
        
        {/* Header: ID + Status + Date */}
        <div className="flex justify-between items-center text-xs font-medium text-gray-700 dark:text-gray-300">
          <span>Mod #{modification.id}</span>
          <span className={`${getStatusColor(modification.request_status)} px-1.5 py-0.5 rounded-full text-[10px]`}>
            {modification.request_status}
          </span>
          <span className="text-gray-400 dark:text-gray-500">{new Date(modification.requested_date).toLocaleDateString()}</span>
        </div>

        {/* Icons row for note/images */}
        <div className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
          {modification.note && <MessageSquare size={12} />}
          {modification.reference_images.length > 0 && <ImageIcon size={12} />}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 mt-1">
          {modification.request_status === 'SENT' && (
            <button
              onClick={() => onStartModification(modification.id)}
              className="flex items-center gap-1 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-full"
            >
              <Play size={12} /> Start
            </button>
          )}
          {modification.request_status === 'STARTED' && (
            <button
              onClick={() => onShowSubmitModificationOverlay(modification)}
              className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"
            >
              <Upload size={12} /> Submit
            </button>
          )}
        </div>
           {modification.id && <MessageButton
                  mockupId={undefined}
                  mockupModificationId={modification.id}
                  leadId={modification.lead}
                   />}
      </div>
    </div>
  )
}

export default ModificationItem