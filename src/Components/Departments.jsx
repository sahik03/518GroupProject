import React, {  useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import NavBar from './NavBar';
import { Link } from "react-router-dom";
import Footer from "./footer";
import axios from 'axios'

const getLawCard = (law) => {
    if(law.state === "Pending") {
        return (
            <li className="card-text text-start" id={law._id}>
                {law.title}<br/>
                {law.description}<br/>
                <button className="like-button btn btn-success"><i className="fa fa-thumbs-up"></i>Yay</button>
                <button className="dislike-button btn btn-danger"><i className="fa fa-thumbs-down"></i>Nay</button>
            </li>
        );
    }
    else if (law.state === "Active") {
        return (
            <li className="card-text text-start" id={law._id}>
                {law.title}<br/>
                {law.description}<br/>
            </li>
        );
    }
    else {
        // Law didnt pass so skip
    }
}


const onSubmitCreateLaw = (event, passedBy, description, title, departmentId, setFetchLaws) => {
    event.preventDefault()
    axios.post("http://localhost:9000/createLaw", { passedBy: passedBy, description: description, title: title, state: "Pending", departmentId: departmentId })
    .then((res) => {
        console.log(res.data);
        // Law was created, noew create vote history
        axios.post("http://localhost:9000/createLawVote", { userID: res.data.passedBy, lawID: res.data._id}).then((res) => {
            console.log(res.data);
            alert("Law Created Successfully")
            setFetchLaws(true);
        }) 
    })
    .catch((error) => {
        console.log(error);
        alert(error.response.data)
    })
}


const getDepartmentHeaderLeft = (name, budget, isMyDepartment) => {
    //Get the current user role
    //...
    //Conditionally render if we show the budget or not

    if(isMyDepartment) {
        return (
            <>
                <h4>{name}</h4>
                <h4>{`Available Budget: $${budget}`}</h4>
            </>
        )
    }
    else {
        return (
            <>
                <h4>{name}</h4>
            </>
        )
    }
}

const getDepartmentHeaderRight = (setContractFormOpen, contractFormOpen, setCreateLawFormOpen, createLawFormOpen, isMyDepartment) => {
    //Get the current user role
    //...
    //Conditionally render if we show the budget or not
    if(isMyDepartment) {
        return (
            <>
                <button className="btn btn-primary active" onClick={() => {
                        if(createLawFormOpen === false && contractFormOpen === false) {
                            setCreateLawFormOpen(!createLawFormOpen)
                        }
                    }}>Create Law</button>
                <button className="btn btn-primary active" onClick={() => {
                        if(createLawFormOpen === false && contractFormOpen === false) {
                            setContractFormOpen(!contractFormOpen)
                        }
                    }}>Create Contract</button>
                <Link to = "/contractrequest" className="btn btn-primary active">
                   Contract Requests
                </Link>
            </>
        )
    }
    // Company?
    //else if(!Object.is(localStorage.getItem("company"), null)) {

    //}
    else {
        return (
            <>
                <h4>Welcome!</h4>
            </>
        )
    }
}


function Department()
{
    const [isMyDepartment, setIsMyDepartment] = useState(false);
    const [fetchIsMyDepartment, setFetchIsMyDepartment] = useState(true);

    const [contractFormOpen, setContractFormOpen] = useState(false)
    const [createLawFormOpen, setCreateLawFormOpen] = useState(false)

    const [lawTitle, setLawTitle] = useState("")
    const [lawDescription, setLawDescription] = useState("")

    const [currentDepartment, setCurrentDepartment] = useState(JSON.parse(localStorage.getItem('currentDepartment')))
    const [fetchDepartment, setFetchDepartment] = useState(true)
    
    const [laws, setLaws] = useState([])
    const [fetchLaws, setFetchLaws] = useState(true)

    const [contractDesc, setContractDesc] = useState("");
    const [Budget,setBudget] = useState(0);

    const [contracts, setContracts] = useState([])
    
    const navigate = useNavigate();
    
    const user = localStorage.getItem('user_id');
    const company = localStorage.getItem('company_id');
    console.log(user,company)

    const onSubmitContract = async (event) => {
        event.preventDefault();
    
        const contract = {
            companyID: company,
            status: "Pending",
            departmentID: currentDepartment._id,
            description: contractDesc,
            budget: Budget
        };
    
        try {
            if (Budget <= currentDepartment.budget) {
                // Post the contract
                const res = await axios.post("http://localhost:9000/createContract", contract);
                console.log(res.data);
    
                // Update the department budget
                const updatedBudget = currentDepartment.budget - Budget;
                const departmentRes = await axios.put(`http://localhost:9000/updateDepartmentBudget/${currentDepartment._id}`, { budget: updatedBudget });
    
                setCurrentDepartment(departmentRes.data)
                // Department budget updated successfully
    
                // Contract was created, now handle the result or perform additional actions
                alert("Contract Posted");
                setContractFormOpen(!contractFormOpen);
            } else {
                alert("Budget exceeding Overall Department Budget");
            }
        } catch (error) {
            console.log(error);
            alert(error.response ? error.response.data : "Error posting contract");
        }
    };
    

    const getPendingContractCard = (Contract) => {
        if (Contract.status === "Pending") {
            return (
                <li className="card-text text-start" id={Contract._id}>
                    {Contract.description}
                    {company && (
                        <>
                            <Link to={`/ApplyContract/${Contract._id}`}>Apply here</Link>
                            <br />
                        </>
                    )}
                </li>
            );
        }
    }
    const getAssignedContractCard = (Contract)=>
    {
        if(Contract.status === "Assigned") {
            return (
                <li className="card-text text-start" id={Contract._id}>
                    
                    {Contract.description}<br/>
                    
                </li>
            );
        }
    }

    useEffect(() => {
        // Check That the user is signed in
        if(Object.is(user, null) && Object.is(company,null) ){
          alert("Please Login to View Departments!");
          navigate('/login');
        }
        if(fetchDepartment) {
            setCurrentDepartment(JSON.parse(localStorage.getItem('currentDepartment')))
            setFetchDepartment(false);
        }
        // If the current User is a city official -> check to see if this is their department
        if(localStorage.getItem("role") === "City Official" && fetchIsMyDepartment) {
            axios.get("http://localhost:9000/getCityOfficialByUserId", { params: { user_id: localStorage.getItem("user_id")}})
            .then((res) => {
                for(const co of res.data) {
                    const dept = JSON.parse(localStorage.getItem('currentDepartment'))
                    // Is the department assigned to the City Offical equal to the current Department?
                    if(co.departmentID === dept._id) {
                        setIsMyDepartment(true);
                        break;
                    }
                }
            })
            setFetchIsMyDepartment(false);
        }

        if(fetchLaws) {
            const dept = JSON.parse(localStorage.getItem('currentDepartment'))
            axios.get("http://localhost:9000/getLawsForDepartmentId", { params: { departmentId: dept._id}})
            .then((res) => {
                //console.log(res.data)
                setLaws(res.data)
            })
            .catch((err) => {
                console.log(err);
            })
            setFetchLaws(false);
        }
        

    })
    useEffect(()=>
    {
         axios.get("http://localhost:9000/getContracts",{params : {departmentID : currentDepartment._id}})
         .then((res)=>
         {
            setContracts(res.data)
         }
         )
         .catch((err)=>
         {
            console.log(err)
         }
         )
    },[]
    )
    if (!user && !company) {
        return null;
    }

    return(
        <div>
            <NavBar/>
            <div className='container-fluid'>
                <div className='container subnav'>
                    <div className="top-left">
                    {
                        getDepartmentHeaderLeft(currentDepartment.name, currentDepartment.budget, isMyDepartment)
                    }
                    </div>
                    <div className="top-right">
                    {
                        getDepartmentHeaderRight(setContractFormOpen, contractFormOpen, setCreateLawFormOpen, createLawFormOpen, isMyDepartment)
                    } 
                    </div>
                </div>

                {
                    contractFormOpen && !createLawFormOpen && <div className = "Container">
                <div className="row row-style text-center">
                    <div className="col-lg-4 offset-4">
                        <h5>Add a Contract</h5>
                        <form className="form">
                        
                            <div className="form-group">
                                <textarea className="form-control" id="UserStory"  placeholder="Enter contract desc" onChange={(event) => setContractDesc(event.target.value)}
                                required/>
                            </div>
                            
                            <div className="form-group">
                                <input type="number" id="Priority" className="form-control" placeholder="Enter budget"  onChange={(event) => setBudget(event.target.value)}
                                required/> 
                            </div>
                            <div>
                                <button type="submit" className="dislike-button btn btn-warning" onClick={() => setContractFormOpen(!contractFormOpen)}>Cancel</button>           
                                <button type="submit" className="like-button btn btn-primary" onClick={onSubmitContract} >Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>    
            }

            
            {
                    createLawFormOpen && !contractFormOpen && <div className = "Container">
                <div className="row row-style text-center">
                    <div className="col-lg-4 offset-4">
                        <h5>Create Law</h5>
                        <form className="form">
                        
                            <div className="form-group">
                                <textarea className="form-control" id="newLawTitle"  placeholder="Enter Title of Law"  onChange={(event) => setLawTitle(event.target.value)}
                                required/>
                            </div>
                            
                            <div className="form-group">
                                <textarea className="form-control" id="newLawTitle"  placeholder=" All tacos are free on Tuesdays..." onChange={(event) => setLawDescription(event.target.value)}
                                required/>
                            </div>

                            <div>
                                <button type="submit" className="dislike-button btn btn-warning" onClick={() => {
                                        setCreateLawFormOpen(!createLawFormOpen)
                                }}>Cancel</button> 

                                <button type="submit" className="like-button btn btn-primary" onClick={(event) => {
                                    onSubmitCreateLaw(event, localStorage.getItem("user_id"), lawDescription, lawTitle, currentDepartment._id, setFetchLaws)
                                    setCreateLawFormOpen(!createLawFormOpen)
                                }}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>    
            }

                <div className="row row-style text-center" >
                    <div className="col-lg-6">
                        <div className="card">
                            <div className="card-body">
                            <div className='card-title '><h5>List of Laws</h5>  </div> 
                                <ul className="custom-list">
                                {
                                    laws.map((law) => getLawCard(law))
                                }
                                </ul>                            
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-lg-6">
                    <div className="row  text-center" >
                            <div className="card">
                                <div className="card-body">
                                    <div className='card-title '><h5>New Contracts</h5>  </div>
                                    
                                        <ul className="custom-list">
                                            {
                                                contracts.map((Contract) => getPendingContractCard(Contract))
                                            }
                                            
                                        </ul>
                                </div>
                            </div>
                        </div>
                        <div className="row  text-center" >
                            <div className="card">
                                <div className="card-body">
                                    <div className='card-title '><h5>List of Contracts</h5>  </div>
                                    
                                        <ul className="custom-list">
                                            {
                                                contracts.map((Contract) => getAssignedContractCard(Contract))
                                            }
                                         </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="row  text-center" >
                            <div className="card">
                                <div className="card-body">
                                    <div className='card-title '><h5>Announcements</h5>  </div>
                                    
                                        <ul className="custom-list">
                                            <li className="card-text text-start">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam</li>
                                            <li className="card-text text-start">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam</li>
                                        </ul>
                                </div>
                            </div>
                        </div>
                    </div> 
                </div>
            </div>
            <Footer />
        </div>
    );

}
export default Department;