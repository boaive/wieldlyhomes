import { useEffect, useRef } from 'react';
import { useEnquiry } from '../state/enquiry';
import { EnquiryForm, type FieldSpec } from './EnquiryForm';

const FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { name: 'company', label: 'Company', autoComplete: 'organization' },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
];

/** "Request catalogue" for the future offerings — a native modal dialog. */
export function CatalogueDialog() {
  const product = useEnquiry((s) => s.catalogue);
  const close = useEnquiry((s) => s.closeCatalogue);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (product && !dialog.open) dialog.showModal();
    if (!product && dialog.open) dialog.close();
  }, [product]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="catalogue-title"
      onClose={close}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) close();
      }}
    >
      {product && (
        <div className="dialog__body">
          <header className="dialog__head">
            <div>
              <p className="label label--lime">Coming soon</p>
              <h2 id="catalogue-title">{product} catalogue</h2>
            </div>
            <button type="button" className="dialog__close" onClick={close} aria-label="Close">
              <span />
              <span />
            </button>
          </header>
          <p className="dialog__lead">Leave your details and Wieldy Homes will share the {product} catalogue when it is released.</p>
          <EnquiryForm key={product} kind="catalogue" subject={`Catalogue request — ${product}`} fields={FIELDS} cta="Request catalogue" extra={{ Product: product }} />
        </div>
      )}
    </dialog>
  );
}
