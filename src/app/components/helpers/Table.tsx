import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import { filter } from "lodash";

const useStyles = makeStyles({
  table: {
    minWidth: 350,
    maxWidth: 800
  },
  paper: {
    minWidth: 350,
    maxWidth: 800
  }
});

type HasID = { id: string | number; [x: string]: any };
export interface DenseTableProps<U extends HasID> {
  rows: Array<U>;
  headers: Array<keyof U>;
}

export default function DenseTable<T extends HasID>({
  rows,
  headers
}: DenseTableProps<T>) {
  const classes = useStyles();

  const headersWithoutID = filter(headers, h => h !== "id");

  return (
    <TableContainer className={classes.table} component={Paper}>
      <Table className={classes.table} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {headersWithoutID.map((header, index) => (
              <TableCell key={index} align="center">{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              {headersWithoutID.map((header, headerIndex) => (
                <TableCell key={headerIndex} align="center">
                  {row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
