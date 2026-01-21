import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'md' 
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  };

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className={`relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full ${maxWidthClasses[maxWidth]}`}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 rounded-t-lg">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4" id="modal-title">
                    {title}
                  </h3>
                  <div className="mt-2">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            {(footer) && (
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                {footer}
              </div>
            )}
            {!footer && (
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                <Button variant="secondary" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
