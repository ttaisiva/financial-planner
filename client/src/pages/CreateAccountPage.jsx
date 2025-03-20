import React, { useEffect, useState } from "react";
import LandingHeader from "../components/LandingHeader";
import CreateAccountForm from "../components/CreateAccountForm";
import Footer from "../components/Footer";

const CreateAccountPage = () => {
    const [credential, setCredential] = useState(sessionStorage.getItem('credential'));
    const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem('userData')));
    sessionStorage.removeItem('credential');
    sessionStorage.removeItem('userData'); 

    return (
        <div>
        <LandingHeader />
        <CreateAccountForm credential={credential} userData={userData}/>
        <Footer />
        </div>
    );
};

export default CreateAccountPage;
