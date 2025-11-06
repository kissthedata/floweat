import { useLocation, useNavigate } from 'react-router-dom';

interface Tab {
  id: string;
  label: string;
  path: string;
}

const TABS: Tab[] = [
  { id: 'upload', label: '사진 올리기', path: '/' },
  { id: 'diary', label: '기록', path: '/diary' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = TABS.findIndex((tab) => tab.path === location.pathname);
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="sticky top-0 bg-white border-b border-border z-10">
      <div className="relative flex">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex-1 h-14 text-base font-medium transition-colors ${
              currentIndex === index
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Animated Indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
          style={{
            width: `${100 / TABS.length}%`,
            transform: `translateX(${currentIndex * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
