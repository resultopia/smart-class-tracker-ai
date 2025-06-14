
import React from "react";

interface StudentCountProps {
  count: number;
}

const StudentCount = ({ count }: StudentCountProps) => (
  <span>
    {count} student{count !== 1 && "s"}
  </span>
);

export default StudentCount;
