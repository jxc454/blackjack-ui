import React, {useContext, useEffect, useState} from "react";
import axios from "axios";
import DenseTable from "../app/components/helpers/Table";
import {TestContext} from "../app/components";

interface Team {
    id: number;
    name: string;
    wins: number;
}

export default function Teams() {
    const [teams, setTeams] = useState([] as Team[]);
    const context = useContext(TestContext);

    useEffect(() => {
        async function getTeams() {
            const res = await axios.get("http://localhost:3000/api/teams");

            setTeams(res.data.message);
        }
        getTeams();
    }, []);

    return teams.length ? (
        <>
            <span>CONTEXT VALUE IS {context}</span>
            <DenseTable rows={teams} headers={['id', 'name', 'wins']}/>
        </>
    ) : (
        <div>Loading...</div>
    );
}
