import React from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({ 
  to, 
  className = '', 
  activeClassName = '', 
  end = false,
  children,
  ...props 
}) => {
  const location = useLocation();
  const toPath = typeof to === 'string' ? to : to.pathname || '';
  
  const isActive = end 
    ? location.pathname === toPath
    : location.pathname.startsWith(toPath);
  
  const finalClassName = isActive 
    ? `${className} ${activeClassName}`.trim()
    : className;

  return (
    <Link to={to} className={finalClassName} {...props}>
      {children}
    </Link>
  );
};
