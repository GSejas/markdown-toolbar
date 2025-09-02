import React from 'react';
export const FmtStrike = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M3 12h18v2H3v-2zm1.5-6h15v2h-15V6zm0 12h15v2h-15v-2z" fillRule="evenodd" /></svg>
);
