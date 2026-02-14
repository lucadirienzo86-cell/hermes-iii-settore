import { cn } from '@/lib/utils';

interface ProgressStep {
  label: string;
  completed: boolean;
  active: boolean;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export const ProgressSteps = ({ steps, className }: ProgressStepsProps) => {
  const activeIndex = steps.findIndex(step => step.active);
  const progressPercent = activeIndex >= 0 
    ? ((activeIndex + 1) / steps.length) * 100
    : steps.filter(s => s.completed).length / steps.length * 100;

  return (
    <div className={cn('progress-steps', className)}>
      <div className="progress-line">
        <div 
          className="progress-line-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {steps.map((step, index) => (
        <div key={index} className="progress-step">
          <div 
            className={cn(
              'progress-step-dot',
              step.completed && 'completed',
              step.active && 'active'
            )}
          />
          <span className="progress-step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
};
