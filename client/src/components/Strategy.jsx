import React, { useState } from "react";
import { useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core"; // drag and collision detection
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"; // modify array order after dnd
import { useSortable } from "@dnd-kit/sortable"; // dnd for individual items
import { CSS } from "@dnd-kit/utilities"; // apply css to dnd items
import "../styles/NewScenario.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {tooltipContent} from "../utils";

const updateStrategySettings = async (endpoint, data) => { // pass endpoint as string parameter
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // Now it uses the latest formData
    });

    if (response.ok) {
      console.log("Strategy settings updated successfully");
    } else {
      console.error("Failed to update strategy settings");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const Strategy = ({ investments, showEventsForm }) => {
  // States to manage form data
  const [rothData, setRothData] = useState({
    optimizer: false,
    rothStartYear: "",
    rothEndYear: "",
    rothConversionStrat: [],
  });
  const [rmdStrat , setRmdStrat] = useState([]);
  const [expenseStrat, setExpenseStrat] = useState([]);
  const [spendingStrat, setSpendingStrat] = useState([]);

  // for rendering investments and expenses to move around
  const [rothAccounts, setRothAccounts] = useState([]);
  const [rmdAccounts, setRmdAccounts] = useState([]);
  const [expAccounts, setExpAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Roth Strategy Updates
  useEffect(() => {
      setRothData((prevData) => ({
        ...prevData,
        rothConversionStrat: rothAccounts,
      }));
  }, [rothAccounts]);

  // Roth Strategy Updates sent to server
    useEffect(() => {
      if (rothData.optimizer){
        updateStrategySettings("http://localhost:3000/api/roth-strategy", rothData);
      }   
  }, [rothData]);
  
  // RMD Strategy Updates
    useEffect(() => {
      setRmdStrat(rmdAccounts);
  }, [rmdAccounts]);
  
  // RMD Strategy Updates sent to server
  useEffect(() => {
      updateStrategySettings("http://localhost:3000/api/rmd-strategy", rmdStrat);
  }, [rmdStrat]);

  // expense withdrawal strategy updates
  useEffect(() => {
    setExpenseStrat(expAccounts);
}, [expAccounts]);

  // expense withdrawal strategy updates sent to server
  useEffect(() => {
      updateStrategySettings("http://localhost:3000/api/expense-withdrawal-strategy", expenseStrat);
  }, [expenseStrat]);

  // spending strategy updates
  useEffect(() => {
    setSpendingStrat(expenses);
  }, [expenses]);

  // spending strategy updates sent to server
  useEffect(() => {
      updateStrategySettings("http://localhost:3000/api/spending-strategy", spendingStrat);
  }, [spendingStrat]);

  return (
    <div>
      <h2>Strategies</h2>

      <SpendingSettings expenses={expenses} setExpenses={setExpenses}
        showEventsForm={showEventsForm} />
      <ExpenseWithdrawSettings expAccounts={expAccounts} setExpAccounts={setExpAccounts}
       investments={investments}/>
      <RothConversionSettings rothData={rothData} setRothData={setRothData} 
        rothAccounts={rothAccounts} setRothAccounts={setRothAccounts} investments={investments}/>
      <RMDSettings rmdAccounts={rmdAccounts}
        setRmdAccounts={setRmdAccounts} investments={investments} rothAccounts={rothAccounts}
        rothData={rothData}/>
    </div>
  );
};

const ExpenseWithdrawSettings = ({investments, expAccounts, setExpAccounts}) => {

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/investments`
        );
        const data = await response.json();
        setExpAccounts(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
      }
    };
    fetchInvestments();
  }, [investments]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;

    if (!active || !over) return;
  
    setExpAccounts((prevExpAccounts) => {
      const newExpAccounts = switchOrder(prevExpAccounts, active.id, over.id);
      return [...newExpAccounts]; // Ensure new array reference
    });
  };
  return (
    <>
      <h3>Expense Withdrawal Strategy</h3>
      <div>
          <p>
            If a cash account does not have enough assets for your expenses,
            withdrawals will be made from other investment accounts to cover
            the difference. The investments will be emptied in this order.<br></br>
            Drag the investments into your preferred order below:
          </p>
          {/* Drag and drop mechanism? */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={expAccounts.map(a => a.id).join(",")} items={expAccounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {expAccounts.map((account) => (
                  <SortableInvestment key={account.id} id={account.id} account={account} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
    </>
  )
}


const RMDSettings = ({rmdAccounts, setRmdAccounts, investments, rothAccounts, rothData }) => {

  useEffect(() => {
    const fetchPreTaxInvestments = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/investments-pretax`);
        const data = await response.json();
        setRmdAccounts(data);
      } catch (error) {
        console.error('Error fetching pre-tax investments:', error);
      }
    };
    fetchPreTaxInvestments();
  }, [investments]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;
  
    if (!active || !over) return;
  
    setRmdAccounts((prevRmdAccounts) => {
      const newRmdAccounts = switchOrder(prevRmdAccounts, active.id, over.id);
      return [...newRmdAccounts]; // Ensure new array reference
    });
  };

  const copyOrder = () => {
    setRmdAccounts(rothAccounts);
  }

  return (
    <>
      <h3> RMD Strategy </h3>

      {rmdAccounts && (
        <div>
          <p>To meet required minimum distributions, assets will be transferred out of 
          your pre-tax retirement accounts into after-tax accounts in the following 
          order. <br></br> Drag the investments into your preferred order below:
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.rmdStrategy}
              className="info-icon"
            >
              ℹ️
            </span>
            <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />  
          </p>
          {/* Drag and drop mechanism */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={rmdAccounts.map(a => a.id).join(",")} items={rmdAccounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>

              <ul>
                {rmdAccounts.map((account) => (
                  <SortableInvestment key={account.id} id={account.id} account={account} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          
        </div>
        
      )}
      {rmdAccounts && rothData.optimizer && (
          <button onClick={copyOrder}>Copy order from Roth conversion</button>
      )}

    </>
  )
}      

// both roth and rmd are ordering on pre tax retirement rothAccounts - share drag and drop component
const RothConversionSettings = ({ rothData, setRothData, rothAccounts, setRothAccounts, investments }) => {

  const handleOptimizerToggle = () => {
    setRothData((prevData) => ({
      ...prevData,
      optimizer: !prevData.optimizer,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRothData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchPreTaxInvestments = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/investments-pretax`
        );
        const data = await response.json();
        setRothAccounts(data);
      } catch (error) {
        console.error("Error fetching pre-tax investments:", error);
      }
    };
    fetchPreTaxInvestments();
  }, [investments]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;

    if (!active || !over) return;
  
    setRothAccounts((prevrothAccounts) => {
      const newrothAccounts = switchOrder(prevrothAccounts, active.id, over.id);
      return [...newrothAccounts]; // Ensure new array reference
    });
  };

  return (
    <>
      {/* Optimizer Settings */}
      <div>
        <div>
            <h3> Roth Conversion Optimizer</h3>
            <p>Roth conversion is a strategic movement of assets from pre-tax to after-tax
              investment accounts that may help to minimize your cumulative income tax. 
              <br></br>Enable the Roth Conversion Optimizer to see if this strategy may benefit you.
            </p>
            <button type="button" onClick={handleOptimizerToggle}>
              {rothData.optimizer ? "Disable Optimizer" : "Enable Optimizer"}
            </button>
          </div>
          {rothData.optimizer && (
            <div>
              <div>
                <label>Start year:</label>
                <input
                  type="number"
                  name="rothStartYear"
                  placeholder="Enter year"
                  value={rothData.rothStartYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>End year:</label>
                <input
                  type="number"
                  name="rothEndYear"
                  placeholder="Enter year"
                  value={rothData.rothEndYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}
      </div>

      {/* Ordering Strategy */}
      {rothData.optimizer && rothAccounts && (
        <div>
          <p>
            Assets will be transferred out of your pre-tax retirement accounts
            into after-tax accounts in the following order. <br></br>
            Drag the investments into your preferred order below:
          </p>
          {/* Drag and drop mechanism? */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={rothAccounts.map(a => a.id).join(",")} items={rothAccounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>

            
              <ul>
                {rothAccounts.map((account) => (
                  <SortableInvestment key={account.id} id={account.id} account={account} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </>
  );
};

// ordering on discretionary expenses
const SpendingSettings = ({expenses, setExpenses, showEventsForm }) => {

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/discretionary-expenses');
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching discretionary expenses:', error);
      }
    };

    fetchExpenses();
  }, [showEventsForm]);

  useEffect(() => {
    console.log("expenses state updated", expenses)
    }, [expenses]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;
  
    if (!active || !over) return;
  
    setExpenses((prevExpenses) => {
      const newExpenses = switchOrder(prevExpenses, active.id, over.id);
      return [...newExpenses]; // Ensure new array reference
    });
  };

  return (
    <div>
      <h3>Spending Strategy</h3>
      <p>Discretionary expenses will be paid one at a time, in the following order.
        <br></br>Drag the expenses into your preferred order below:
      </p>
      {/* Drag and drop mechanism */}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={expenses.map(a => a.id).join(",")} items={expenses.map((expense) => expense.id)} strategy={verticalListSortingStrategy}>

              <ul>
                {expenses.map((expense) => (
                  <SortableExpense key={expense.id} id={expense.id} expense={expense} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
    </div>
  );
};

// individual item for drag and drop
const SortableInvestment = ({ id, account }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className="drag"
      style={style}
      {...attributes}
      {...listeners}
    >
      {account.investment_type}: ${account.dollar_value}, ({account.tax_status})
    </div>
  );
};

// individual item for drag and drop
const SortableExpense = ({ id, expense }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className="drag"
      style={style}
      {...attributes}
      {...listeners}
    >
      {expense.name} (${expense.initialAmount}): {expense.description}
    </div>
  );
};

const switchOrder = (items, activeId, overId) => {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);

  if (oldIndex === newIndex) return items; // Avoid unnecessary updates

  return arrayMove(items, oldIndex, newIndex); // Return the updated order
};

export default Strategy;


