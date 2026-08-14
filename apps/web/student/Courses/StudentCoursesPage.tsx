import React, { useState, useEffect } from 'react';
import { DashboardApi } from '@nermai/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookOpen } from 'lucide-react';

export const StudentCoursesPage = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardApi.getStudentOverview()
      .then(res => setCourses(res.data?.data?.myCourses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Courses" 
        description="Access your enrolled courses and learning materials." 
      />
      
      {loading ? (
        <div className="text-textSecondary">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="p-8 border border-dashed border-border rounded-xl text-center">
          <BookOpen className="mx-auto text-textSecondary mb-4 w-12 h-12" />
          <h3 className="text-lg font-bold text-textPrimary">No Courses Yet</h3>
          <p className="text-textSecondary">You are not enrolled in any courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Card key={course.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <BookOpen size={24} />
                  </div>
                  <Badge variant="success">Enrolled</Badge>
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-2">{course.name || course.title}</h3>
                <p className="text-sm text-textSecondary line-clamp-2">{course.description || 'No description available.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
