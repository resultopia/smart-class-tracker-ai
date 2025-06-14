
import React from "react";

interface ForgotPasswordLinkProps {
  onClick: () => void;
}

const ForgotPasswordLink: React.FC<ForgotPasswordLinkProps> = ({ onClick }) => (
  <div className="text-center">
    <button
      onClick={onClick}
      className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
      type="button"
    >
      Forgot your password?
    </button>
  </div>
);

export default ForgotPasswordLink;
