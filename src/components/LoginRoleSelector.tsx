
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User } from "lucide-react";

interface LoginRoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const roleOptions = [
  {
    value: "student",
    label: "Student",
    border: "border-blue-600",
    bg: "bg-blue-50",
    shadow: "shadow-md",
    focus: "focus-within:ring-2 focus-within:ring-blue-400",
    iconColor: "text-blue-600",
    hover: "hover:border-blue-300 hover:bg-blue-50/40",
    text: "text-blue-700",
  },
  {
    value: "teacher",
    label: "Teacher",
    border: "border-purple-600",
    bg: "bg-purple-50",
    shadow: "shadow-md",
    focus: "focus-within:ring-2 focus-within:ring-purple-400",
    iconColor: "text-purple-700",
    hover: "hover:border-purple-300 hover:bg-purple-50/40",
    text: "text-purple-700",
  },
  {
    value: "admin",
    label: "Admin",
    border: "border-rose-600",
    bg: "bg-rose-50",
    shadow: "shadow-md",
    focus: "focus-within:ring-2 focus-within:ring-rose-400",
    iconColor: "text-rose-600",
    hover: "hover:border-rose-300 hover:bg-rose-50/40",
    text: "text-rose-700",
  },
];

const LoginRoleSelector: React.FC<LoginRoleSelectorProps> = ({ value, onChange }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 mb-1 block">Sign in as</label>
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex flex-col sm:flex-row gap-3 mt-2"
      aria-label="Sign in as"
    >
      {roleOptions.map((role) => (
        <label
          key={role.value}
          htmlFor={role.value}
          className={`group flex-1 min-w-[128px] select-none flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer
            ${value === role.value ? `${role.border} ${role.bg} ${role.shadow}` : `border-gray-200 bg-white ${role.hover}`}
            ${role.focus}`}
        >
          <RadioGroupItem
            value={role.value}
            id={role.value}
            className="peer"
          />
          <User
            className={`h-5 w-5 transition-colors ${value === role.value ? role.iconColor : "text-gray-400 group-hover:" + role.iconColor}`}
          />
          <span className={`font-medium text-base ${value === role.value ? role.text : "text-gray-700"}`}>
            {role.label}
          </span>
        </label>
      ))}
    </RadioGroup>
  </div>
);

export default LoginRoleSelector;
