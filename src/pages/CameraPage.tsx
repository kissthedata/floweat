import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common';

export default function CameraPage() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (image) {
      // 이미지를 state로 전달
      navigate('/goal', { state: { imageUrl: image } });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center"
        >
          <img
            src="/components/arrow_back.png"
            alt="뒤로가기"
            className="w-6 h-6"
          />
        </button>
      </div>

      <div className="page-content flex flex-col">
        <h1 className="text-[26px] font-bold text-text-primary mb-6 leading-[1.4]">
          음식 사진을
          <br />
          업로드해주세요
        </h1>

        <div className="flex-1 flex items-center justify-center">
          {image ? (
            <div className="relative w-full max-w-md">
              <img
                src={image}
                alt="Selected food"
                className="w-full rounded-card shadow-lg"
              />
              <button
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-text-secondary hover:bg-gray-50"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md h-64 border-2 border-dashed border-border rounded-card flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light transition-colors"
            >
              <span className="text-6xl mb-4">📷</span>
              <p className="text-base font-medium text-text-primary">
                사진 선택하기
              </p>
              <p className="text-sm text-text-secondary mt-2">
                갤러리에서 음식 사진을 선택하세요
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <div className="page-bottom">
        <Button fullWidth disabled={!image} onClick={handleUpload}>
          다음
        </Button>
      </div>
    </div>
  );
}
