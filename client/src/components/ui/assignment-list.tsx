import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText, BookOpen } from "lucide-react";
import { Assignment } from "@shared/schema";
import { useLocation } from "wouter";

interface AssignmentListProps {
  assignments: Assignment[];
  onViewAll?: () => void;
  onViewAssignment?: (assignmentId: number) => void;
}

export function AssignmentList({
  assignments,
  onViewAll,
  onViewAssignment
}: AssignmentListProps) {
  const [, navigate] = useLocation();
  
  // Function to format due date
  const getDueStatus = (dueDate: Date | null | undefined) => {
    if (!dueDate) return { label: "No deadline", color: "bg-neutral-100 text-neutral-600" };
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: "Overdue", color: "bg-error bg-opacity-10 text-error" };
    } else if (diffDays === 0) {
      return { label: "Due today", color: "bg-error bg-opacity-10 text-error" };
    } else if (diffDays === 1) {
      return { label: "Due tomorrow", color: "bg-error bg-opacity-10 text-error" };
    } else if (diffDays <= 3) {
      return { label: `Due in ${diffDays} days`, color: "bg-warning bg-opacity-10 text-warning" };
    } else {
      return { label: `Due in ${diffDays} days`, color: "bg-neutral-100 text-neutral-600" };
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Upcoming Assignments</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {assignments.length > 0 
                ? `${assignments.length} assignment${assignments.length > 1 ? 's' : ''} waiting - click to complete!`
                : 'All caught up! New assignments will appear here.'
              }
            </p>
          </div>
          {onViewAll && (
            <Button variant="link" onClick={onViewAll} className="text-sm text-primary">
              View all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-neutral-200">
          {assignments.length === 0 ? (
            <li className="p-4 text-center text-neutral-500">
              <div className="py-4">
                <FileText className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-medium">No assignments due</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep learning! New assignments will be posted by your instructors.
                </p>
                <div className="mt-4">
                  <Button 
                    onClick={() => navigate('/courses')}
                    variant="default"
                    size="sm"
                    className="gap-2"
                    data-testid="enroll-lesson-button-assignments"
                  >
                    <BookOpen className="h-4 w-4" />
                    Enroll a Lesson
                  </Button>
                </div>
              </div>
            </li>
          ) : (
            assignments.map((assignment) => {
              const dueStatus = getDueStatus(assignment.dueDate);
              
              return (
                <li key={assignment.id} className="p-4 hover:bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-neutral-900">{assignment.title}</h3>
                        <p className="text-xs text-neutral-500">
                          {(assignment as any).course ? (assignment as any).course.title : 'Course Name'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`${dueStatus.color} text-xs py-1 px-2 rounded-full`}>
                        {dueStatus.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4"
                        onClick={() => onViewAssignment && onViewAssignment(assignment.id)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
