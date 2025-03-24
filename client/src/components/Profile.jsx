import React, {useState, useEffect} from 'react';
import "../styles/Profile.css";

const UserInfo = ({userData}) => {
    // Needs Profile Picture, Full Name, Email

    return (
        <div className="profile_user_info">
            <img alt="profile picture"></img>
            <h2>{userData.name} {userData.lastName}'s Profile</h2>
            <label>Email</label>
            <p>{userData.email}</p>
        </div>
    );
}

const UserYAML = ({userData}) => {
    const [file, setFile] = useState({name: ""});
    // ChatGPT - Prompt: how can i make the submit button disabled until a file is uploaded
    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
          setFile(uploadedFile);
        } else {
          setFile("");
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (file.name.endsWith(".yaml")) {
            const formData = new FormData();
            formData.append('file', file);
            console.log(file, formData);
            fetch("http://localhost:3000/user/upload/statetax", {
                method: "POST",
                credentials: "include",
                body: formData
            }).then(res => console.log(res.status));
        }
    }

    

    return (
        <div className="profile_yaml">
            <h2>Uploaded State Tax Rates & Brackets</h2>
            <form className="profile_form" onSubmit={handleSubmit}>
                <label htmlFor="yamlupload">Upload State Tax Rates & Brackets</label>
                <input name="yamlupload" type="file" accept=".yaml" onChange={handleFileChange}></input>
                <button type="submit" disabled={!(file.name.endsWith(".yaml"))}>Upload File</button>
            </form>

        </div>
    )
};

const Profile = () => {
    const [userData, setUserData] = useState({name: "", lastName: "", email: ""});

    useEffect(() => {
        fetch("http://localhost:3000/auth/isAuth", {
        method: "GET",
        credentials: "include",
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("the data", data);
            if (data.email == "") {
                window.location.href = "/dashboard";
            }
            setUserData(data);
        });
    }, []);
    return (
        <div>
            <div className="profile_main_container">
                <div className="profile_left">
                    <UserInfo userData={userData} />
                    <div className="profile_delete">
                        <button id="delete_btn">Delete Account</button>
                    </div>
                </div>
                <div className="profile_right">
                    <UserYAML userData={userData} />
                </div>
            </div>
        </div>
    );
};

export default Profile;