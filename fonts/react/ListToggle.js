import React from 'react';
export const ListToggle = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M11 4h10v2H11V4zm0 6h10v2H11v-2zm0 6h10v2H11v-2z" fillRule="evenodd" /></svg>
);
