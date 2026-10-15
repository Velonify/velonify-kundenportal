import { Fragment } from 'react';

const URL_MUSTER = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]])/g;

/** Plain text with line breaks kept and web addresses as links (new tab). Never renders HTML. */
export function Text({ text, className = 'text' }: { text: string; className?: string }) {
  const teile = text.split(URL_MUSTER);
  return (
    <p className={className}>
      {teile.map((teil, i) =>
        i % 2 === 1 ? (
          <a key={i} href={teil} target="_blank" rel="noopener noreferrer">
            {teil.replace(/^https?:\/\//, '').slice(0, 60)}
            {teil.replace(/^https?:\/\//, '').length > 60 ? '…' : ''}
          </a>
        ) : (
          <Fragment key={i}>{teil}</Fragment>
        ),
      )}
    </p>
  );
}
