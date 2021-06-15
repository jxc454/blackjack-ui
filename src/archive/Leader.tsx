import React, { useEffect, useState } from "react";
import axios from "axios";
import DenseTable from "../app/components/helpers/Table";

export default function Leader() {
  const [leader, setLeader] = useState(
    undefined as { name: string; wins: number } | undefined
  );
  useEffect(() => {
    async function getLeader() {
      const leader = await axios.get("http://localhost:3000/api/leader");
      setLeader(leader.data.message);
    }

    getLeader();
  }, []);

  return leader ? (
    <DenseTable rows={[Object.assign({id: 1}, leader)]} headers={['name', 'wins']}/>
  ) : null;
}
