import * as React from 'react';

export function BilingualText({ text }: { text: string }) {
  return <span>{text.split(' – ')[0]}</span>;
}
