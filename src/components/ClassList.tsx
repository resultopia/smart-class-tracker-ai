
import ClassCard from "@/components/ClassCard";
import { Class } from "@/lib/types";

interface ClassListProps {
  classes: Class[];
  teacherId: string;
  onStatusChange: () => void;
}

const ClassList = ({ classes, teacherId, onStatusChange }: ClassListProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {classes.map((cls) => (
      <ClassCard 
        key={cls.id} 
        classData={cls} 
        teacherId={teacherId} 
        onStatusChange={onStatusChange}
      />
    ))}
  </div>
);

export default ClassList;
