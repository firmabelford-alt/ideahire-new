export function ArrowIcon({ direction = 'right', className = '', ...props }) {
  const paths = { right: 'M4 12h16m-7-7 7 7-7 7', left: 'M20 12H4m7-7-7 7 7 7', 'up-right': 'M6 18 18 6M6 6h12v12', down: 'M12 4v16m-7-7 7 7 7-7' };
  return <svg className={`ih-arrow-icon ${className}`.trim()} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[direction] || paths.right}/></svg>;
}
