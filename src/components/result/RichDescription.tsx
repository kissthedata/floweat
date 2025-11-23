/**
 * 먹는 순서 설명에서 인식된 음식명을 컬러풀한 태그로 표시하는 컴포넌트
 */

import type { FoodItem } from '../../types';
import { highlightRecognizedFoods } from '../../utils/highlightRecognizedFoods';
import { getFoodTagColor } from '../../utils/foodTagColors';

interface RichDescriptionProps {
  description: string;
  recognizedFoods: FoodItem[];
}

export default function RichDescription({
  description,
  recognizedFoods
}: RichDescriptionProps) {
  const parts = highlightRecognizedFoods(description, recognizedFoods);

  return (
    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
      {parts.map((part, index) => {
        if (part.isFood && part.foodName) {
          const color = getFoodTagColor(part.foodName);

          return (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mx-0.5"
              style={{
                backgroundColor: color.bg,
                color: color.text,
                border: `1px solid ${color.border}`
              }}
            >
              {part.text}
            </span>
          );
        }

        return <span key={index}>{part.text}</span>;
      })}
    </p>
  );
}
