import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CandidateResult {
  name: string;
  party: string;
  symbol: string;
  votes: number;
}

interface PollChartProps {
  results: CandidateResult[];
  title: string;
  totalVotes: number;
}

const PollChart = ({ results, title, totalVotes }: PollChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);

  // Array of colors for different candidates
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'];

  // Format data for recharts
  useEffect(() => {
    if (results && results.length > 0) {
      const formattedData = results.map((result) => ({
        name: result.name,
        party: result.party,
        votes: result.votes,
        // Calculate percentage with one decimal place
        percentage: totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : '0.0',
      }));

      // Sort by votes in descending order
      formattedData.sort((a, b) => b.votes - a.votes);
      setChartData(formattedData);
    }
  }, [results, totalVotes]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border shadow-lg rounded-md">
          <p className="font-bold">{data.name}</p>
          <p className="text-gray-600">{data.party}</p>
          <p className="text-blue-600 font-medium mt-1">
            {data.votes} votes ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">Total Votes: {totalVotes}</p>
      
      {chartData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="votes" name="Votes">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-60">
          <p className="text-gray-500">No voting data available yet</p>
        </div>
      )}
      
      {/* Results Table */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Detailed Results:</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Rank</th>
                <th className="border px-4 py-2 text-left">Candidate</th>
                <th className="border px-4 py-2 text-left">Party</th>
                <th className="border px-4 py-2 text-right">Votes</th>
                <th className="border px-4 py-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2 font-medium">{result.name}</td>
                  <td className="border px-4 py-2">{result.party}</td>
                  <td className="border px-4 py-2 text-right">{result.votes}</td>
                  <td className="border px-4 py-2 text-right">{result.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PollChart; 