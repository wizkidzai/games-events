import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#006464] text-[#FAFAFA] hover:bg-[#005050] active:bg-[#004040] focus:outline-none focus:ring-2 focus:ring-[#006464] focus:ring-offset-2',
  secondary:
    'bg-transparent text-[#2D2D2D] border border-[#2D2D2D] hover:bg-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:ring-offset-2',
  danger:
    'bg-[#FF4747] text-[#FAFAFA] hover:bg-[#e03d3d] focus:outline-none focus:ring-2 focus:ring-[#FF4747] focus:ring-offset-2',
};

export function Button({ variant = 'primary', className = '', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        px-6 py-3 rounded-lg
        font-semibold text-base
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
