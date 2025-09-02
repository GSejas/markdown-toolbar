import React from 'react';
export const PreviewSide = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M5 7h3v2H5V7zm0 4h6v2H5v-2zm0 4h3v2H5v-2z" fillRule="evenodd" />,
<path d="M16 7h3v8h-3V7z" fillRule="evenodd" /></svg>
);
