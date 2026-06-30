import { useEffect, useState } from 'react';
import DataTable from './DataTable';
import Pagination from './Pagination';
import { Search } from 'lucide-react';
import { useOutletContext, useLocation } from "react-router";

interface OutletContextType {
  isSidebarOpen: boolean;
}

interface ApiItem {
  _id: string;
  network: string;
  owner: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ViewReport() {
  const { isSidebarOpen } = useOutletContext<OutletContextType>();
  const [data, setData] = useState<ApiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const networkQuery = queryParams.get('network');
  const networkFilter = networkQuery === 'tron' ? 'TRON Mainnet' : 'BSC Mainnet';

  const params = new URLSearchParams({
    network: networkFilter,
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_URL}/api/approved?${params}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result.data);
      })
      .catch((error) => console.error(error));
  }, [networkFilter]);

  const filteredData = data.filter(
    (item) =>
      (item.owner?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.network?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );


  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  // const handleExport = (type: string) => {
  //   alert(`Exporting data as ${type}...`);
  // };
  return (
    <div className="w-full space-y-6">
      <h2 className="text-3xl">{networkFilter === 'TRON Mainnet' ? 'TRON View Report' : 'BSC View Report'}</h2>
      {/* <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="rowsPerPage" className="text-sm text-gray-600">
                  Show
                </label>
                <select
                  id="rowsPerPage"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">rows</span>
              </div>
    
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleExport('Copy')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => handleExport('Excel')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('CSV')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('Print')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
            </div> */}

      <div className="w-full mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address or blockchain..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <DataTable
          data={paginatedData}
          allData={filteredData}
          autoFetchAll={networkFilter === 'TRON Mainnet' || networkFilter === 'BSC Mainnet'}
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of{' '}
          {filteredData.length} entries
        </p>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
