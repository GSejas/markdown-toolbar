import React from 'react';
export const BreakLine = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M3 7h18v2H3V7zm0 8h18v2H3v-2z" fillRule="evenodd" />,
<path d="M12 12l-3-3m3 3l3-3m-3 3v6" fillRule="evenodd" /></svg>
);
