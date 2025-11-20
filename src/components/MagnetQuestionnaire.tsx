import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ChevronLeft } from "lucide-react";

export interface QuestionnaireAnswers {
  conveyorType: string;
  suspensionHeight: string;
  burdenDepth: string;
  beltWidth: string;
  constraints: string;
  trampMetal: string;
  environment: string;
}

interface MagnetQuestionnaireProps {
  onComplete: (answers: QuestionnaireAnswers, recommendation: string) => void;
}

const questions = [
  {
    id: "conveyorType",
    question: "What type of conveyor or equipment is this installed on?",
    options: [
      { value: "mobile", label: "Mobile crusher / mobile screen / mobile plant" },
      { value: "primary", label: "Fixed primary crusher / quarry primary" },
      { value: "midrange", label: "Mid-range conveyor (transfer, processing, loadout)" },
      { value: "biomass", label: "Biomass, recycling, or lightweight conveyor" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "suspensionHeight",
    question: "What's the suspension height (air gap)?",
    options: [
      { value: "<350", label: "Under 350 mm" },
      { value: "350-550", label: "350 – 550 mm" },
      { value: "550-700", label: "550 – 700 mm" },
      { value: ">700", label: "Over 700 mm" },
    ],
  },
  {
    id: "burdenDepth",
    question: "What is the burden depth (material height)?",
    options: [
      { value: "<75", label: "<75 mm (light)" },
      { value: "75-150", label: "75–150 mm (moderate)" },
      { value: "150-300", label: "150–300 mm (heavy)" },
      { value: ">300", label: ">300 mm (very heavy)" },
    ],
  },
  {
    id: "beltWidth",
    question: "What's your belt width?",
    options: [
      { value: "≤1200", label: "≤1200 mm" },
      { value: "1200-2000", label: "1200–2000 mm" },
      { value: ">2000", label: ">2000 mm" },
    ],
  },
  {
    id: "constraints",
    question: "Are space or weight constraints a factor?",
    options: [
      { value: "yes", label: "Yes (tight structure / mobile / weight limits)" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "trampMetal",
    question: "How large or frequent is the tramp metal?",
    options: [
      { value: "small", label: "Small / occasional (nuts, bolts, plate)" },
      { value: "mixed", label: "Mixed sizes" },
      { value: "large", label: "Large or frequent (rebar, bucket teeth, tools, big chunks)" },
    ],
  },
  {
    id: "environment",
    question: "Operating environment",
    options: [
      { value: "normal", label: "Normal temp environment" },
      { value: "hightemp", label: "High temp (>40–45°C)" },
      { value: "247", label: "24/7 operation" },
    ],
  },
];

const getRecommendation = (answers: QuestionnaireAnswers): string => {
  const ocwFactors = [
    answers.suspensionHeight === ">700",
    answers.burdenDepth === "150-300" || answers.burdenDepth === ">300",
    answers.beltWidth === ">2000",
    answers.trampMetal === "large",
    answers.environment === "247",
    answers.environment === "hightemp",
    answers.conveyorType === "primary",
  ];

  const electroMaxFactors = [
    answers.conveyorType === "mobile",
    answers.constraints === "yes",
    answers.suspensionHeight === "<350",
  ];

  const ocwScore = ocwFactors.filter(Boolean).length;
  const electroMaxScore = electroMaxFactors.filter(Boolean).length;

  if (ocwScore >= 2) {
    return "OCW (Oil-Cooled)";
  } else if (electroMaxScore >= 2) {
    return "ElectroMax";
  } else {
    return "ACW (Air-Cooled)";
  }
};

export const MagnetQuestionnaire = ({ onComplete }: MagnetQuestionnaireProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id as keyof QuestionnaireAnswers];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const recommendation = getRecommendation(answers as QuestionnaireAnswers);
      onComplete(answers as QuestionnaireAnswers, recommendation);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground">
              Magnet Selection Guide
            </h2>
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            {currentQuestion.question}
          </h3>

          <RadioGroup value={currentAnswer || ""} onValueChange={handleAnswer}>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleAnswer(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
          >
            {currentStep === questions.length - 1 ? "Get Recommendation" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
