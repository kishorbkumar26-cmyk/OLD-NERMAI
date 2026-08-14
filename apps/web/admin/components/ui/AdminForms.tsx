import React from 'react';

export const AdminInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(({ label, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-medium text-[#E5E5E5]">{label}</label>
    <input
      ref={ref}
      className={`bg-surface border border-accent/30 rounded-lg px-4 py-2.5 text-white placeholder:text-textSecondary/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all ${className}`}
      {...props}
    />
  </div>
));
AdminInput.displayName = 'AdminInput';

export const AdminSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string, disabled?: boolean }[] }>(({ label, options, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-medium text-[#E5E5E5]">{label}</label>
    <select
      ref={ref}
      className={`bg-surface border border-accent/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      ))}
    </select>
  </div>
));
AdminSelect.displayName = 'AdminSelect';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const AdminButton: React.FC<AdminButtonProps> = ({ variant = 'primary', isLoading, children, className = '', disabled, ...props }) => {
  const baseStyle = "px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-accent to-primary text-white hover:shadow-accent/40 border border-transparent",
    secondary: "bg-surface text-white border border-accent/30 hover:bg-accent/10",
    danger: "bg-transparent text-[#FF3333] border border-[#FF3333]/30 hover:bg-[#FF3333]/10",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
};
