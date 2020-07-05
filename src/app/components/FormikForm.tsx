import React from "react";
import { ErrorMessage, Field, Form, Formik, useFormik } from "formik";
import * as Yup from "yup";

const FormikRenderProp = () => (
  <Formik
    initialValues={{
      name: "",
      wins: 0
    }}
    onSubmit={(values, _) => console.log(values)}
    validationSchema={Yup.object().shape({
      name: Yup.string().required(" name is required"),
      wins: Yup.number().required(" wins is required")
    })}
  >
    {() => {
      return (
        <>
          <h2>Add a Team</h2>
          <Form>
            <label htmlFor="name">Team Name</label>
            <Field name="name" type="text" />
            <ErrorMessage component="span" name="name" />
            <br />
            <label htmlFor="wins">Wins</label>
            <Field name="wins" type="text" />
            <ErrorMessage component="span" name="wins" />
            <br />
            <button type="submit">Submit</button>
          </Form>
        </>
      );
    }}
  </Formik>
);

export { FormikRenderProp };
