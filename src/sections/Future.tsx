import { future } from '../content/copy';
import { LENGTH } from '../content/timeline';
import { useEnquiry } from '../state/enquiry';
import type { ChapterId } from '../state/stage';
import { Arrow } from '../ui/Arrow';
import { Chapter, Label, Title } from '../ui/Chapter';

interface Product {
  label: string;
  status: string;
  name: string;
  title: string[];
  body: string;
  cta: string;
}

function FutureProduct({ id, product, length }: { id: ChapterId; product: Product; length: number }) {
  const openCatalogue = useEnquiry((s) => s.openCatalogue);
  return (
    <Chapter id={id} length={length}>
      <div className="overlay">
        <div className="overlay__top">
          <Label>{product.label}</Label>
          <Label className="status label--lime">{product.status}</Label>
        </div>
        <div className="overlay__main">
          <div className="stack">
            <Title lines={product.title} className="title--xl" />
            <p className="body">{product.body}</p>
            <button type="button" className="btn" onClick={() => openCatalogue(product.name)}>
              {product.cta}
              <Arrow />
            </button>
          </div>
        </div>
        <div className="overlay__side">
          <p className="label concept-note">
            Concept model
            <br />
            Not yet available to configure
          </p>
        </div>
      </div>
    </Chapter>
  );
}

/** 09 Labour Precamp and 10 Capsule House — future offerings, catalogue on request. */
export function Future() {
  return (
    <>
      <FutureProduct id="precamp" product={future.precamp} length={LENGTH.precamp} />
      <FutureProduct id="capsule" product={future.capsule} length={LENGTH.capsule} />
    </>
  );
}
