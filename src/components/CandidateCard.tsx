import Image from 'next/image';
import { FiCheck } from 'react-icons/fi';

interface CandidateCardProps {
  id: string;
  name: string;
  party: string;
  symbol: string;
  selected?: boolean;
  votes?: number;
  showVotes?: boolean;
  onSelect?: (id: string) => void;
}

const CandidateCard = ({
  id,
  name,
  party,
  symbol,
  selected = false,
  votes,
  showVotes = false,
  onSelect,
}: CandidateCardProps) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 transition-all cursor-pointer relative ${
        selected 
          ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center">
        {/* Party Symbol */}
        <div className="flex-shrink-0 mr-4 w-16 h-16 relative">
          <Image
            src={symbol}
            alt={`${party} symbol`}
            className="object-contain"
            fill
          />
        </div>

        {/* Candidate Info */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-gray-600">{party}</p>
          
          {/* Show votes if requested */}
          {showVotes && (
            <p className="mt-2 font-medium text-blue-700">
              {votes} vote{votes !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
            <FiCheck size={16} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard; 