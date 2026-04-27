import React from "react";

export const Button = React.forwardRef(function Button(
  { className = "", ...props },
  ref,
) {
  return <button ref={ref} className={className} {...props} />;
});
