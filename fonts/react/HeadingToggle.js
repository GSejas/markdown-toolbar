import React from 'react';
export const HeadingToggle = props => (
  <svg viewBox="0 0 20 20"  {...props} className={`MyIcons ${props.className ? props.className : ''}`}><path d="M6 4v16h3V4H6zm6 0v6h3V4h-3zm6 0v10h3V4h-3z" fillRule="evenodd" /></svg>
);
