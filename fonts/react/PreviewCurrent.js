import React from 'react';
export const PreviewCurrent = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M5 7h3v2H5V7zm0 4h10v2H5v-2zm0 4h6v2H5v-2z" fillRule="evenodd" />,
<path d="M16 15h6v-4l-2-2-2 2-2 2v2z" fillRule="evenodd" /></svg>
);
