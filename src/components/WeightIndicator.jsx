import { FiRefreshCcw } from "react-icons/fi";



const WeightIndicator = ({unitType,weight,neto} )=>{
    
    return (
        <div
        className={`grid grid-cols-1 grid-flow-row gap-3 col-span-${
          process.env.REACT_APP_4Kg == "1" ? "1" : "2"
        } `}
      >
        <div className="col-span-1 ...">
          <div className="flex-1 p-4 border rounded bg-white">
            <h1 className="text-blue-600 font-semibold mb-2 text-xl">
              Brutto
            </h1>
            <div className="">
              <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                {weight.toFixed(2) ?? 0}
                <FiRefreshCcw size={20} />
              </div>
              <p className="flex justify-center text-2xl font-bold">
                {unitType}
              </p>
            </div>
          </div>
        </div>
        <div className="col-span- row-span-1">
          <div className="flex-1 p-4 border rounded bg-white">
            <h1 className="text-blue-600 font-semibold mb-2 text-xl">
              Netto
            </h1>
            <div className="">
              <div className="flex-1 flex justify-center p-4 border rounded bg-gray-200 text-5xl font-semibold">
                {(neto || 0).toFixed(2)} <FiRefreshCcw size={20} />
              </div>
              <p className="flex justify-center text-2xl font-bold">
                {unitType}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
}
export default WeightIndicator;